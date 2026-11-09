// @vitest-environment jsdom
import type { ILiveQuestion } from '@/modules/Workspace';
import type { FormEvent } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAskCardViewModel } from '@/modules/Run/components/AskCard/hooks/useAskCardViewModel';
import { EXPLORATION } from '@/shared/constants';

const QUESTION: ILiveQuestion = {
  id: 'q-1',
  question: 'Which plan should I pick?',
  options: ['Premium', 'Premium+'],
  isSecret: false,
  secret: { name: 'QA_ANSWER_1', description: 'Which plan should I pick?' },
  caseId: 'TC-02',
  stepNumber: 3,
  action: 'Pick a plan',
  askedAtMs: 0,
  waitsUntilMs: 900_000,
  waitedSec: 83,
};

const SECRET: ILiveQuestion = {
  ...QUESTION,
  question: 'What is the code texted to your phone?',
  options: [],
  isSecret: true,
  secret: { name: 'OTP_CODE', description: 'The code texted to the QA' },
};

const SUBMIT = { preventDefault: vi.fn() } as unknown as FormEvent;

function card(question: ILiveQuestion = QUESTION) {
  const onAnswer = vi.fn();
  const rendered = renderHook(() => useAskCardViewModel({ question, onAnswer }));

  return { onAnswer, result: rendered.result };
}

afterEach(() => {
  cleanup();
});

describe('useAskCardViewModel', () => {
  describe('what it shows', () => {
    it('says where the run is and what the agent asks, and nothing else', () => {
      const { result } = card();

      expect(result.current.eyebrow).toBe('The agent needs you');
      expect(result.current.where).toBe('TC-02 · step 3');
      expect(result.current.question).toBe('Which plan should I pick?');
      expect(result.current.options.map(({ label }) => label)).toEqual([
        'Premium',
        'Premium+',
      ]);
      expect(result.current.fieldLabel).toBe('Or answer in your own words');
    });

    it('says the screen an exploration was on, or only that it explores', () => {
      const exploring = { ...QUESTION, caseId: EXPLORATION.caseId, action: 'Cart' };

      expect(card(exploring).result.current.where).toBe('Exploring · Cart');
      expect(card({ ...exploring, action: '' }).result.current.where).toBe('Exploring');
    });

    /**
     * Um segredo é digitado, nunca escolhido: uma resposta num botão seria um valor na
     * tela.
     */
    it('asks a secret in a hidden field, with no answers to pick', () => {
      const { result } = card(SECRET);

      expect(result.current.isSecret).toBe(true);
      expect(result.current.hasOptions).toBe(false);
      expect(result.current.canMakeSecret).toBe(false);
      expect(result.current.fieldLabel).toBe('Type it: it becomes a secret');
    });
  });

  describe('onPick', () => {
    it('answers with the option at once', () => {
      const { result, onAnswer } = card();

      act(() => {
        result.current.options[1]?.onPick();
      });

      expect(onAnswer).toHaveBeenCalledWith({ kind: 'said', text: 'Premium+' });
      expect(result.current.className).toBe('ask-card ask-card--sent');
    });

    it('does NOT answer twice', () => {
      const { result, onAnswer } = card();

      act(() => {
        result.current.options[0]?.onPick();
      });
      act(() => {
        result.current.options[1]?.onPick();
      });

      expect(onAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSend', () => {
    it("sends the QA's own words, on the button and on Enter", () => {
      const { result, onAnswer } = card();

      act(() => {
        result.current.onText('The yearly one');
      });
      act(() => {
        result.current.onSubmit(SUBMIT);
      });

      expect(SUBMIT.preventDefault).toHaveBeenCalled();
      expect(onAnswer).toHaveBeenCalledWith({ kind: 'said', text: 'The yearly one' });
    });

    it('does NOT send an answer with nothing in it', () => {
      const { result, onAnswer } = card();

      act(() => {
        result.current.onText('   ');
      });
      act(() => {
        result.current.onSend();
      });

      expect(result.current.canSend).toBe(false);
      expect(onAnswer).not.toHaveBeenCalled();
    });

    it('sends a secret as typed, spaces included, and whether the project keeps it', () => {
      const { result, onAnswer } = card(SECRET);

      act(() => {
        result.current.onText(' 4821 ');
      });
      act(() => {
        result.current.onKeep(true);
      });
      act(() => {
        result.current.onSend();
      });

      expect(onAnswer).toHaveBeenCalledWith({
        kind: 'secret',
        value: ' 4821 ',
        isKept: true,
      });
    });
  });

  describe('onSecret', () => {
    /** O agente esqueceu de pedir um segredo: o QA ainda mantém uma senha longe dele. */
    it('lets the QA send any answer as a secret, under the name main gave it', () => {
      const { result, onAnswer } = card();

      act(() => {
        result.current.onSecret();
      });
      act(() => {
        result.current.onText('hunter2');
      });
      act(() => {
        result.current.onSend();
      });

      expect(result.current.hasOptions).toBe(false);
      expect(onAnswer).toHaveBeenCalledWith({
        kind: 'secret',
        value: 'hunter2',
        isKept: false,
      });
    });

    it('does NOT turn a secret the agent asked for back into words', () => {
      const { result } = card(SECRET);

      act(() => {
        result.current.onSecret();
      });

      expect(result.current.isSecret).toBe(true);
    });
  });

  describe('onKeep', () => {
    it('does NOT keep an answer that is not a secret', () => {
      const { result } = card();

      act(() => {
        result.current.onKeep(true);
      });

      expect(result.current.isKept).toBe(false);
    });
  });
});

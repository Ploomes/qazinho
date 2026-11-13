// @vitest-environment jsdom
import type { IIslandQuestion, IslandAction } from '@/shared/types';
import type { KeyboardEvent } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useIslandAsk } from '@/modules/Island/screens/Island/hooks/useIslandAsk';

const SIZE: IIslandQuestion = {
  workspaceId: 'w1',
  questionId: 'q-1',
  project: 'Loja',
  workspace: 'Compra',
  question: 'Qual tamanho?',
  options: ['P', 'M'],
  isSecret: false,
};
const OPEN: IIslandQuestion = {
  ...SIZE,
  workspaceId: 'w2',
  questionId: 'q-2',
  workspace: 'Cadastro',
  question: 'Qual e-mail uso?',
  options: [],
};
const CODE: IIslandQuestion = {
  ...SIZE,
  workspaceId: 'w3',
  questionId: 'q-3',
  question: 'Qual o código que chegou no celular?',
  isSecret: true,
};

let acted: IslandAction[] = [];
let keyboard: boolean[] = [];

beforeEach(async () => {
  await i18n.changeLanguage('en');
  acted = [];
  keyboard = [];
  window.qazinhoIsland = {
    onFrame: () => () => undefined,
    hover: () => undefined,
    keyboard: (isWanted) => {
      keyboard.push(isWanted);
    },
    act: (action) => {
      acted.push(action);
    },
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinhoIsland');
});

/** Uma tecla no campo, do jeito que o React a entrega. */
const key = (name: string) =>
  ({
    key: name,
    nativeEvent: { isComposing: false },
    preventDefault: () => undefined,
    currentTarget: { blur: () => undefined },
  }) as unknown as KeyboardEvent<HTMLInputElement>;

describe('useIslandAsk', () => {
  it('has nothing to show with no question', () => {
    const { result } = renderHook(() => useIslandAsk([]));

    expect(result.current).toEqual({ isHeld: false, view: null });
  });

  it('names the project and the workspace, with no arrows for a question alone', () => {
    const { result } = renderHook(() => useIslandAsk([SIZE]));

    expect(result.current.view).toMatchObject({
      title: 'Loja / Compra',
      question: 'Qual tamanho?',
      position: null,
      hasOptions: true,
      canType: true,
      secretNote: null,
      openLabel: 'Open',
    });
  });

  it('walks the questions with the arrows, and comes around at the ends', () => {
    const { result } = renderHook(() => useIslandAsk([SIZE, OPEN]));

    expect(result.current.view?.position).toBe('1 of 2');

    act(() => {
      result.current.view?.onNext();
    });

    expect(result.current.view).toMatchObject({
      position: '2 of 2',
      question: 'Qual e-mail uso?',
      hasOptions: false,
    });

    act(() => {
      result.current.view?.onNext();
    });

    expect(result.current.view?.question).toBe('Qual tamanho?');

    act(() => {
      result.current.view?.onPrevious();
    });

    expect(result.current.view?.question).toBe('Qual e-mail uso?');
  });

  /** Uma pergunta que chega não pode tirar a resposta de baixo do dedo do QA. */
  it('stays on the question it shows when a newer one arrives', () => {
    const { result, rerender } = renderHook((list) => useIslandAsk(list), {
      initialProps: [OPEN],
    });

    rerender([OPEN, SIZE]);

    expect(result.current.view).toMatchObject({
      question: 'Qual e-mail uso?',
      position: '1 of 2',
    });
  });

  it('goes on to the next question once the one it shows is answered', () => {
    const { result, rerender } = renderHook((list) => useIslandAsk(list), {
      initialProps: [SIZE, OPEN],
    });

    rerender([OPEN]);

    expect(result.current.view?.question).toBe('Qual e-mail uso?');
  });

  it('answers with the option picked, once', () => {
    const { result } = renderHook(() => useIslandAsk([SIZE]));

    act(() => {
      result.current.view?.options[1]?.onPick();
    });
    act(() => {
      result.current.view?.options[0]?.onPick();
    });

    expect(acted).toEqual([
      { kind: 'answer', workspaceId: 'w1', questionId: 'q-1', text: 'M' },
    ]);
  });

  it('keeps what was typed for each question while the QA walks between them', () => {
    const { result } = renderHook(() => useIslandAsk([SIZE, OPEN]));

    act(() => {
      result.current.view?.onDraft('G, por favor');
    });
    act(() => {
      result.current.view?.onNext();
    });

    expect(result.current.view?.draft).toBe('');

    act(() => {
      result.current.view?.onPrevious();
    });

    expect(result.current.view?.draft).toBe('G, por favor');
  });

  it('sends what was typed with Enter, trimmed, and nothing when it is empty', () => {
    const { result } = renderHook(() => useIslandAsk([OPEN]));

    act(() => {
      result.current.view?.onFieldKeyDown(key('Enter'));
    });

    expect(acted).toEqual([]);
    expect(result.current.view?.canSend).toBe(false);

    act(() => {
      result.current.view?.onDraft('  qa@loja.test ');
    });

    expect(result.current.view?.canSend).toBe(true);

    act(() => {
      result.current.view?.onFieldKeyDown(key('Enter'));
    });

    expect(acted).toEqual([
      { kind: 'answer', workspaceId: 'w2', questionId: 'q-2', text: 'qa@loja.test' },
    ]);
    expect(result.current.view?.canSend).toBe(false);
  });

  /** Um segredo nunca passa pela ilha: só o cartão do chat o digita. */
  it('offers no option nor field for a secret, only the way to the app', () => {
    const { result } = renderHook(() => useIslandAsk([CODE]));

    expect(result.current.view).toMatchObject({
      hasOptions: false,
      options: [],
      canType: false,
      secretNote: 'This answer is a secret, so you type it in the app.',
      openLabel: 'Answer in the app',
    });

    act(() => {
      result.current.view?.onDraft('123456');
      result.current.view?.onOpen();
    });

    expect(acted).toEqual([{ kind: 'open', workspaceId: 'w3' }]);
  });

  describe('the keyboard', () => {
    it('is left alone until the QA presses the field, and given back on leaving it', () => {
      const { result } = renderHook(() => useIslandAsk([OPEN]));

      expect(keyboard).toEqual([false]);
      expect(result.current.isHeld).toBe(false);

      act(() => {
        result.current.view?.onFieldPress();
      });

      expect(keyboard).toEqual([false, true]);
      expect(result.current.isHeld).toBe(true);

      act(() => {
        result.current.view?.onFieldBlur();
      });

      expect(keyboard).toEqual([false, true, false]);
      expect(result.current.isHeld).toBe(false);
    });

    it('is given back when the question goes away while the QA types', () => {
      const { result, rerender } = renderHook((list) => useIslandAsk(list), {
        initialProps: [OPEN],
      });

      act(() => {
        result.current.view?.onFieldPress();
      });
      rerender([]);

      expect(result.current.isHeld).toBe(false);
      expect(keyboard.at(-1)).toBe(false);

      rerender([SIZE]);

      expect(result.current.isHeld).toBe(false);
      expect(keyboard.at(-1)).toBe(false);
    });
  });
});

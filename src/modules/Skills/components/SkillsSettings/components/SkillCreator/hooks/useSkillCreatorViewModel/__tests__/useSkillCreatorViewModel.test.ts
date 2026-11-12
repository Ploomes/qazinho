// @vitest-environment jsdom
import type { IWriteSkill, SkillWritten } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useSkillCreatorViewModel } from '@/modules/Skills/components/SkillsSettings/components/SkillCreator/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSettingsStore } from '@/store';

const ROUND: SkillWritten = {
  isAnswered: true,
  sessionId: 's1',
  answer: {
    reply: 'I read the 12 cases. One question first.',
    questions: [
      {
        header: 'Priority',
        question: 'How do you pick a priority?',
        options: [{ label: 'By the risk', description: 'Payments first' }],
        isMultiSelect: false,
      },
    ],
    skill: null,
  },
};
const DONE: SkillWritten = {
  isAnswered: true,
  sessionId: 's1',
  answer: {
    reply: 'Here it is.',
    questions: [],
    skill: {
      name: 'cases-gherkin',
      description: 'When writing cases',
      body: '## Format',
    },
  },
};

const creator = () => {
  const props = { onClose: vi.fn(), onWrite: vi.fn(), onDrafted: vi.fn() };

  return { ...renderHook(() => useSkillCreatorViewModel(props)), ...props };
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useSettingsStore.setState({ agent: 'Claude Code', model: '', language: 'en' });
  useMachineStore.setState({
    agents: [
      {
        id: 'claude-code',
        name: 'Claude Code',
        command: 'claude',
        isFound: true,
        path: '/bin/claude',
        defaultModel: null,
        isSignedIn: true,
      },
    ],
  });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    writeSkill: vi.fn().mockResolvedValueOnce(ROUND).mockResolvedValueOnce(DONE),
    attachToSkill: vi.fn().mockResolvedValue([{ name: 'cts.pdf', isImage: false }]),
    dropSkillDraft: vi.fn().mockResolvedValue(undefined),
    stopSkill: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSkillCreatorViewModel', () => {
  it('asks the agent, shows its round of questions, and answers them as one message', async () => {
    const { result } = creator();

    act(() => {
      result.current.onText({ target: { value: 'Our cases are Gherkin.' } } as never);
    });
    await act(async () => {
      result.current.onSend();
      await Promise.resolve();
    });

    const [first] = vi.mocked(window.qazinho.writeSkill).mock.calls[0] as [IWriteSkill];

    expect(first).toMatchObject({
      agentId: 'claude-code',
      text: 'Our cases are Gherkin.',
      current: null,
      language: 'en',
    });
    expect(result.current.talk.map(({ from }) => from)).toEqual(['qa', 'agent']);
    expect(result.current.question?.header).toBe('Priority');

    await act(async () => {
      result.current.question?.options[0]?.onPick();
      await Promise.resolve();
    });

    const [second] = vi.mocked(window.qazinho.writeSkill).mock.calls[1] as [IWriteSkill];

    expect(second).toMatchObject({
      text: 'Priority: By the risk',
      sessionId: 's1',
      draftId: first.draftId,
    });
    expect(result.current.skill).toEqual({
      title: 'Skill ready: cases-gherkin',
      description: 'When writing cases',
    });
    expect(result.current.canConfirm).toBe(true);
  });

  it('hands the ready skill to the editor with its draft and the files attached', async () => {
    window.qazinho.writeSkill = vi.fn().mockResolvedValue(DONE);
    const { result, onDrafted } = creator();

    await act(async () => {
      await result.current.onAttach();
    });
    act(() => {
      result.current.onText({ target: { value: 'Gherkin, please.' } } as never);
    });
    await act(async () => {
      result.current.onSend();
      await Promise.resolve();
    });
    act(() => {
      result.current.onConfirm();
    });

    expect(onDrafted).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'cases-gherkin',
        files: [{ name: 'cts.pdf', isImage: false }],
        draftId: expect.stringMatching(/^d/) as string,
      }),
    );
  });

  it('says to set up the agent when it is missing, and does NOT send an empty message', async () => {
    window.qazinho.writeSkill = vi
      .fn()
      .mockResolvedValue({ isAnswered: false, reason: 'agent-missing', said: '' });
    const { result } = creator();

    expect(result.current.canSend).toBe(false);

    act(() => {
      result.current.onText({ target: { value: 'Hi' } } as never);
    });
    await act(async () => {
      result.current.onSend();
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Set up your agent in Settings › Agent first.');
  });

  it('goes to writing by hand, dropping the draft', () => {
    const { result, onWrite } = creator();

    act(() => {
      result.current.onMode('hand');
    });

    expect(window.qazinho.dropSkillDraft).toHaveBeenCalled();
    expect(onWrite).toHaveBeenCalled();
  });
});

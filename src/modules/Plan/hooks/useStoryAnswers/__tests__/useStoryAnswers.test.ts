// @vitest-environment jsdom
import type { IStoryAnswersAsk, StoryAnswers } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoryAnswers } from '@/modules/Plan/hooks/useStoryAnswers';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSetupStore, useWorkspaceStore } from '@/store';

const SENT = {
  url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=100',
  at: '2026-11-13T13:00:00.000Z',
};
const ISSUE = {
  key: 'SHOP-878',
  title: 'Coupons at checkout',
  source: 'jira' as const,
  url: 'https://shop.atlassian.net/browse/SHOP-878',
};

function answering(answers: StoryAnswers) {
  const read = vi.fn((_: IStoryAnswersAsk) => Promise.resolve(answers));

  window.qazinho = { ...fakeQazinhoApi('darwin'), readStoryAnswers: read };

  return read;
}

const doubtsNow = () => useWorkspaceStore.getState().workspaces[0]?.doubts;

beforeEach(() => {
  useSetupStore.setState({
    integrations: [{ id: 'jira', account: 'ana@shop.test', site: 'shop.atlassian.net' }],
  } as never);
  useWorkspaceStore.setState({
    storyReadAt: {},
    workspaces: [
      {
        ...makeWorkspace([]),
        issue: ISSUE,
        doubts: [
          { id: 'D1', question: 'Does a coupon stack?', sent: SENT, answer: null },
          { id: 'D2', question: 'Which error?', sent: null, answer: null },
        ],
      },
    ],
  });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

/**
 * Ler a história não chama o agente de ninguém: é o Jira do QA, quando ele abre o plano,
 * o Início ou clica. Mesmo assim, abrir a aba duas vezes seguidas não pergunta duas vezes.
 */
describe('useStoryAnswers', () => {
  it('asks Jira about the doubts that went to the story, and writes the answers', async () => {
    const read = answering({
      isRead: true,
      answers: [
        {
          doubtId: 'D1',
          text: 'They stack.',
          by: 'Rui PO',
          at: '2026-11-13T15:00:00.000Z',
        },
      ],
    });
    const { result } = renderHook(() => useStoryAnswers());

    await act(() => result.current.read({ workspaceId: 'w1' }));

    expect(read).toHaveBeenCalledWith({
      key: 'SHOP-878',
      doubts: [{ id: 'D1', sent: SENT }],
    });
    expect(doubtsNow()?.[0]?.answer).toEqual({
      text: 'They stack.',
      by: 'Rui PO',
      at: '2026-11-13T15:00:00.000Z',
    });
  });

  it('does NOT ask again right away, unless the QA clicked', async () => {
    const read = answering({ isRead: true, answers: [] });
    const { result } = renderHook(() => useStoryAnswers());

    await act(() => result.current.read({ workspaceId: 'w1' }));
    await act(() => result.current.read({ workspaceId: 'w1' }));

    expect(read).toHaveBeenCalledOnce();

    await act(() => result.current.read({ workspaceId: 'w1', isForced: true }));

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('says why Jira did not answer, and keeps the doubts as they were', async () => {
    answering({ isRead: false, failure: 'unauthorized' });
    const { result } = renderHook(() => useStoryAnswers());
    let said: StoryAnswers | null = null;

    await act(async () => {
      said = await result.current.read({ workspaceId: 'w1' });
    });

    expect(said).toEqual({ isRead: false, failure: 'unauthorized' });
    expect(doubtsNow()?.[0]?.answer).toBeNull();
  });

  it('does NOT ask with Jira disconnected, or with nothing sent to the story', async () => {
    const read = answering({ isRead: true, answers: [] });
    const { result } = renderHook(() => useStoryAnswers());

    useSetupStore.setState({ integrations: [] });
    await act(() => result.current.read({ workspaceId: 'w1', isForced: true }));

    useSetupStore.setState({
      integrations: [
        { id: 'jira', account: 'ana@shop.test', site: 'shop.atlassian.net' },
      ],
    } as never);
    useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace([]), issue: ISSUE }] });
    await act(() => result.current.read({ workspaceId: 'w1', isForced: true }));

    expect(read).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import type { IStoryAnswersAsk, StoryAnswers, StoryStatus } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoryCheck } from '@/modules/Plan/hooks/useStoryCheck';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSetupStore, useWorkspaceStore } from '@/store';

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
  useAppStore.setState({
    projects: [
      {
        id: 'p1',
        name: 'Shop',
        targets: [],
        repositories: [],
        readyStatuses: ['Ready for QA'],
      },
    ],
  });
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
describe('useStoryCheck', () => {
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
    const { result } = renderHook(() => useStoryCheck());

    await act(() => result.current.check({ workspaceId: 'w1' }));

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
    const { result } = renderHook(() => useStoryCheck());

    await act(() => result.current.check({ workspaceId: 'w1' }));
    await act(() => result.current.check({ workspaceId: 'w1' }));

    expect(read).toHaveBeenCalledOnce();

    await act(() => result.current.check({ workspaceId: 'w1', isForced: true }));

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('says why Jira did not answer, and keeps the doubts as they were', async () => {
    answering({ isRead: false, failure: 'unauthorized' });
    const { result } = renderHook(() => useStoryCheck());
    let said: StoryAnswers | null = null;

    await act(async () => {
      said = await result.current.check({ workspaceId: 'w1' });
    });

    expect(said).toEqual({ isRead: false, failure: 'unauthorized' });
    expect(doubtsNow()?.[0]?.answer).toBeNull();
  });

  it('does NOT ask with Jira disconnected, or with nothing sent to the story', async () => {
    const read = answering({ isRead: true, answers: [] });
    const { result } = renderHook(() => useStoryCheck());

    useSetupStore.setState({ integrations: [] });
    await act(() => result.current.check({ workspaceId: 'w1', isForced: true }));

    useSetupStore.setState({
      integrations: [
        { id: 'jira', account: 'ana@shop.test', site: 'shop.atlassian.net' },
      ],
    } as never);
    useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace([]), issue: ISSUE }] });
    await act(() => result.current.check({ workspaceId: 'w1', isForced: true }));

    expect(read).not.toHaveBeenCalled();
  });

  /** Um plano escrito antes do app fica sabendo, sem agente nenhum, que a história chegou. */
  describe('a story ahead of the app', () => {
    function statusing(status: StoryStatus) {
      const read = vi.fn(() => Promise.resolve(status));

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        readStoryStatus: read,
        readStoryAnswers: () => Promise.resolve({ isRead: true, answers: [] }),
      };

      return read;
    }

    beforeEach(() => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace([]), issue: ISSUE, storyStage: 'ahead' }],
      });
    });

    it('marks the story arrived once it is in a status the project counts', async () => {
      const read = statusing({ isRead: true, status: 'Ready for QA' });
      const { result } = renderHook(() => useStoryCheck());

      await act(() => result.current.check({ workspaceId: 'w1' }));

      expect(read).toHaveBeenCalledWith('SHOP-878');
      expect(useWorkspaceStore.getState().workspaces[0]?.storyStage).toBe('arrived');
    });

    it('keeps waiting while the story is in another status', async () => {
      statusing({ isRead: true, status: 'In Progress' });
      const { result } = renderHook(() => useStoryCheck());

      await act(() => result.current.check({ workspaceId: 'w1' }));

      expect(useWorkspaceStore.getState().workspaces[0]?.storyStage).toBe('ahead');
    });

    it('does NOT ask about the status when the project counts no status', async () => {
      const read = statusing({ isRead: true, status: 'Ready for QA' });

      useAppStore.setState({
        projects: [{ id: 'p1', name: 'Shop', targets: [], repositories: [] }],
      });

      const { result } = renderHook(() => useStoryCheck());

      await act(() => result.current.check({ workspaceId: 'w1', isForced: true }));

      expect(read).not.toHaveBeenCalled();
    });
  });
});

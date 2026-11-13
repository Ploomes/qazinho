// @vitest-environment jsdom
import type { IPlanDoubtsProps } from '@/modules/Plan/screens/Plan/components/PlanDoubts/types';
import type { ITestCase } from '@/modules/Plan/types';
import type { IAskAgent, IChatTurn, IPlanDoubt, StoryAnswers } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlanDoubtsViewModel } from '@/modules/Plan/screens/Plan/components/PlanDoubts/hooks';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useAssistantStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

const SENT = {
  url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=100',
  at: '2026-11-13T13:00:00.000Z',
};
const ANSWER = { text: 'They stack.', by: 'Rui PO', at: '2026-11-13T15:00:00.000Z' };
const ISSUE = {
  key: 'SHOP-878',
  title: 'Coupons at checkout',
  source: 'jira' as const,
  url: 'https://shop.atlassian.net/browse/SHOP-878',
};
const JIRA = { id: 'jira', account: 'ana@shop.test', site: 'shop.atlassian.net' };

const testCase = (props: Partial<ITestCase> & { id: string }): ITestCase => ({
  title: 'A coupon',
  priority: 'P1',
  goal: '',
  preconditions: '',
  steps: [],
  lastVerdict: null,
  ...props,
});

function bridge(answers: StoryAnswers = { isRead: true, answers: [] }) {
  const read = vi.fn(() => Promise.resolve(answers));
  const ask = vi.fn((_: IAskAgent): Promise<IChatTurn> =>
    Promise.resolve({
      sessionId: 's1',
      text: '',
      usage: null,
      costUsd: null,
      isError: false,
      answer: null,
      failure: null,
      code: null,
      story: null,
      page: null,
      followed: [],
    }),
  );

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    readStoryAnswers: read,
    askAgent: ask,
  };

  return { read, ask };
}

/** Monta o view model sobre o workspace da store, como a aba Plano o monta. */
function render(props: { doubts: IPlanDoubt[]; plan?: ITestCase[]; isLocked?: boolean }) {
  const plan = props.plan ?? [testCase({ id: 'TC-01' })];

  useWorkspaceStore.setState({
    workspaces: [{ ...makeWorkspace(plan), issue: ISSUE, doubts: props.doubts }],
  });

  return renderHook((current: IPlanDoubtsProps) => usePlanDoubtsViewModel(current), {
    initialProps: {
      workspaceId: 'w1',
      doubts: props.doubts,
      issue: ISSUE,
      plan,
      isLocked: props.isLocked ?? false,
    },
  });
}

const storeDoubts = () => useWorkspaceStore.getState().workspaces[0]?.doubts;

beforeEach(() => {
  useAppStore.setState({ projects: [], selectedWorkspaceId: 'w1', screen: 'workspace' });
  useSettingsStore.setState({ agent: 'Claude Code', model: 'haiku', tab: 'agent' });
  useMachineStore.setState({ agents: [] });
  useSetupStore.setState({ integrations: [JIRA] } as never);
  useAssistantStore.setState({ tip: null, isOpen: false });
  useWorkspaceStore.setState({ askingIds: [], storyReadAt: {} });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('usePlanDoubtsViewModel', () => {
  describe('the list', () => {
    it('shows each doubt with where it stands, and nothing when there are none', () => {
      bridge();

      const { result } = render({
        doubts: [
          { id: 'D1', question: 'Stack?', sent: null, answer: null },
          { id: 'D2', question: 'Error?', sent: SENT, answer: null },
          { id: 'D3', question: 'Limit?', sent: SENT, answer: ANSWER },
        ],
      });

      expect(
        result.current.rows.map(({ id, state, canRemove }) => [id, state, canRemove]),
      ).toEqual([
        ['D1', 'Not sent', true],
        ['D2', 'Waiting on the team', false],
        ['D3', 'Answered by Rui PO', false],
      ]);
      expect(result.current.rows[2]?.answer).toBe('They stack.');
      expect(render({ doubts: [] }).result.current.isShown).toBe(false);
    });

    it('drops a doubt never sent, and the cases stop waiting for it', () => {
      bridge();

      const { result } = render({
        doubts: [{ id: 'D1', question: 'Stack?', sent: null, answer: null }],
        plan: [testCase({ id: 'TC-01', blockedBy: ['D1'] })],
      });

      act(() => {
        result.current.onRemove('D1');
      });

      expect(storeDoubts()).toEqual([]);
      expect(useWorkspaceStore.getState().workspaces[0]?.plan[0]?.blockedBy).toEqual([]);
    });
  });

  describe('sending to the story', () => {
    it('opens the comment for the doubts not sent yet', () => {
      bridge();

      const { result } = render({
        doubts: [
          { id: 'D1', question: 'Stack?', sent: SENT, answer: null },
          { id: 'D2', question: 'Error?', sent: null, answer: null },
        ],
      });

      expect(result.current.canSend).toBe(true);

      act(() => {
        result.current.onSend();
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.unsent.map(({ id }) => id)).toEqual(['D2']);
    });

    /** Sem saída morta: com o Jira desligado, o botão leva aonde ele liga. */
    it('takes the QA to connect Jira first, and the Intern says what to do there', () => {
      bridge();
      useSetupStore.setState({ integrations: [] });

      const { result } = render({
        doubts: [{ id: 'D1', question: 'Stack?', sent: null, answer: null }],
      });

      act(() => {
        result.current.onSend();
      });

      expect(result.current.isModalOpen).toBe(false);
      expect(useAppStore.getState().screen).toBe('settings');
      expect(useSettingsStore.getState().tab).toBe('connections');
      expect(useAssistantStore.getState().tip?.text).toBe(
        'Connect Jira here, then send the doubts from the Plan tab.',
      );
    });

    it('marks the doubts as sent once the comment is posted, and says where', () => {
      bridge();

      const { result } = render({
        doubts: [{ id: 'D1', question: 'Stack?', sent: null, answer: null }],
      });

      act(() => {
        result.current.onPosted({
          sent: SENT,
          questions: [{ id: 'D1', question: 'Does a coupon stack?' }],
        });
      });

      expect(storeDoubts()).toEqual([
        { id: 'D1', question: 'Does a coupon stack?', sent: SENT, answer: null },
      ]);
      expect(result.current.notice).toMatchObject({
        text: 'Comment posted on SHOP-878.',
        url: SENT.url,
      });
    });

    it('does NOT offer to send while a run walks the plan', () => {
      bridge();

      expect(
        render({
          doubts: [{ id: 'D1', question: 'Stack?', sent: null, answer: null }],
          isLocked: true,
        }).result.current.canSend,
      ).toBe(false);
    });
  });

  describe('the answers', () => {
    it('reads the story when the plan opens, and again when the QA asks', async () => {
      const { read } = bridge({
        isRead: true,
        answers: [{ doubtId: 'D1', ...ANSWER }],
      });

      const { result } = render({
        doubts: [{ id: 'D1', question: 'Stack?', sent: SENT, answer: null }],
      });

      await waitFor(() => {
        expect(storeDoubts()?.[0]?.answer).toEqual(ANSWER);
      });
      expect(read).toHaveBeenCalledOnce();
      expect(result.current.canRead).toBe(true);
    });

    it('says when the story has no answers yet, or why Jira did not say', async () => {
      const { read } = bridge({ isRead: true, answers: [] });
      const { result } = render({
        doubts: [{ id: 'D1', question: 'Stack?', sent: SENT, answer: null }],
      });

      await waitFor(() => {
        expect(read).toHaveBeenCalledOnce();
      });

      act(() => {
        result.current.onRead();
      });

      await waitFor(() => {
        expect(result.current.notice?.text).toBe('No answers on SHOP-878 yet.');
      });

      bridge({ isRead: false, failure: 'unreachable' });

      act(() => {
        result.current.onRead();
      });

      await waitFor(() => {
        expect(result.current.notice).toMatchObject({
          text: 'Jira is out of reach from this machine. Check the network.',
          isFailed: true,
        });
      });
    });

    it('asks the chat to update the cases that waited for an answer', async () => {
      const { ask } = bridge();
      const { result } = render({
        doubts: [{ id: 'D1', question: 'Stack?', sent: SENT, answer: ANSWER }],
        plan: [testCase({ id: 'TC-01', blockedBy: ['D1'] })],
      });

      expect(result.current.held).toMatchObject({
        text: 'The team answered D1 on the story.',
        canApply: true,
      });

      act(() => {
        result.current.onApply();
      });

      await waitFor(() => {
        expect(ask).toHaveBeenCalledOnce();
      });
      expect(ask.mock.calls[0]?.[0].text).toBe(
        'The team answered D1 on the story. Update the cases that waited for them.',
      );
      expect(useWorkspaceStore.getState().workspaces[0]?.chat[0]).toMatchObject({
        kind: 'user',
        text: 'The team answered D1 on the story. Update the cases that waited for them.',
      });
    });

    it('does NOT write to the chat while its agent is still answering', () => {
      const { ask } = bridge();

      useWorkspaceStore.setState({ askingIds: ['w1'] });

      const { result } = render({
        doubts: [{ id: 'D1', question: 'Stack?', sent: SENT, answer: ANSWER }],
        plan: [testCase({ id: 'TC-01', blockedBy: ['D1'] })],
      });

      act(() => {
        result.current.onApply();
      });

      expect(result.current.held?.canApply).toBe(false);
      expect(ask).not.toHaveBeenCalled();
    });
  });
});

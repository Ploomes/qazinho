// @vitest-environment jsdom
import type { IPlanChangesProps } from '@/modules/Plan/screens/Plan/components/PlanChanges/types';
import type { IPendingChange, ITestCase } from '@/modules/Plan/types';
import type { ChangeReading, IReadChange, ISourcesChecked } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reviewOf } from '@/modules/Plan/library';
import { usePlanChangesViewModel } from '@/modules/Plan/screens/Plan/components/PlanChanges/hooks';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSettingsStore, useWorkspaceStore } from '@/store';

const CASE: ITestCase = {
  id: 'TC-04',
  title: 'Cupom inválido bloqueia',
  priority: 'P1',
  goal: '',
  preconditions: '',
  steps: [{ action: 'Errar o cupom 3 vezes', expected: 'Tente de novo mais tarde' }],
  lastVerdict: 'passed',
  sources: ['C3'],
};
const SNAP = {
  kind: 'story' as const,
  key: 'SHOP-878',
  url: 'https://shop.atlassian.net/browse/SHOP-878',
  text: 'C3. 3 tentativas',
  at: '2026-11-13T13:00:00.000Z',
};
const FOUND = {
  kind: 'story' as const,
  key: 'SHOP-878',
  url: SNAP.url,
  at: '2026-11-13T15:00:00.000Z',
  before: 'C3. 3 tentativas',
  after: 'C3. 5 tentativas',
  comments: [],
};
const CHANGED: IPendingChange = {
  found: [FOUND],
  snapshots: [{ ...SNAP, text: 'C3. 5 tentativas' }],
  code: null,
  at: '2026-11-13T15:00:00.000Z',
};
const READ = {
  summary: 'O critério 3 passou de 3 para 5 tentativas.',
  changes: [
    {
      caseId: 'TC-04',
      why: 'C3 diz 5',
      case: {
        title: 'Cupom inválido bloqueia',
        priority: 'P1' as const,
        goal: '',
        preconditions: '',
        steps: [
          { action: 'Errar o cupom 5 vezes', expected: 'Tente de novo mais tarde' },
        ],
        sources: ['C3'],
      },
    },
  ],
  added: [],
  doubts: ['O bloqueio dura quanto?'],
  answered: [],
};
const ISSUE = {
  key: 'SHOP-878',
  title: 'Cupom',
  source: 'jira' as const,
  url: 'https://shop.atlassian.net/browse/SHOP-878',
};

function bridge(props: { checked?: Partial<ISourcesChecked>; reading?: ChangeReading }) {
  const read = vi.fn((_: IReadChange) =>
    Promise.resolve(props.reading ?? { isRead: true as const, read: READ }),
  );

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    checkSources: (ask) =>
      Promise.resolve({
        changes: [],
        snapshots: ask.snapshots,
        code: ask.code,
        missed: [],
        ...props.checked,
      }),
    readChange: read,
  };

  return read;
}

/** Monta o view model sobre o workspace da store, que ele relê a cada render. */
function render(over: Partial<IPlanChangesProps> = {}) {
  return renderHook(() => {
    const workspace = useWorkspaceStore.getState().workspaces[0];

    return usePlanChangesViewModel({
      workspaceId: 'w1',
      plan: workspace?.plan ?? [],
      doubts: workspace?.doubts ?? [],
      issue: workspace?.issue ?? null,
      changed: workspace?.changed ?? null,
      review: workspace?.review ?? null,
      canCheck: true,
      isLocked: false,
      actions: null,
      more: [],
      ...over,
    });
  });
}

const now = () => useWorkspaceStore.getState().workspaces[0];

beforeEach(() => {
  useSettingsStore.setState({
    agent: 'Claude Code',
    model: 'opus',
    language: 'pt',
  } as never);
  useMachineStore.setState({ agents: [] });
  useWorkspaceStore.setState({
    workspaces: [{ ...makeWorkspace([CASE]), issue: ISSUE, snapshots: [SNAP] }],
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('usePlanChangesViewModel', () => {
  describe('the bar', () => {
    it('keeps what comes into the plan and what goes out of it in one bar', () => {
      const { result } = render({ actions: 'Ver em Gherkin' });

      expect(result.current).toMatchObject({
        hasBar: true,
        canCheck: true,
        canMeet: true,
        actions: 'Ver em Gherkin',
      });
    });

    it('still shows the plan’s own actions when there is nothing to check', () => {
      const { result } = render({ canCheck: false, plan: [], actions: 'Ver em Gherkin' });

      expect(result.current).toMatchObject({
        hasBar: true,
        canCheck: false,
        canMeet: false,
      });
    });

    it('gathers the meeting and the plan’s own actions in More, for a narrow column', () => {
      const onPick = vi.fn();
      const { result } = render({
        more: [{ key: 'feature', label: 'Arquivo .feature', icon: 'download', onPick }],
      });

      expect(result.current.hasMore).toBe(true);
      expect(result.current.moreItems.map(({ key }) => key)).toEqual(['meet', 'feature']);

      act(() => {
        result.current.moreItems[0]?.onPick();
      });

      expect(result.current.isMeeting).toBe(true);
    });

    it('does NOT offer the meeting in More while a change waits for review', () => {
      const { result } = render({ plan: [], more: [] });

      expect(result.current).toMatchObject({ hasMore: false, moreItems: [] });
    });

    it('does NOT draw an empty bar', () => {
      const { result } = render({ canCheck: false, plan: [], actions: null });

      expect(result.current.hasBar).toBe(false);
    });
  });

  describe('checking the sources', () => {
    it('says when nothing changed, with no agent asked', async () => {
      const read = bridge({});
      const { result } = render();

      act(() => {
        result.current.onCheck();
      });

      await waitFor(() => {
        expect(result.current.notice?.text).toBe(
          'Nothing changed in the sources since this plan.',
        );
      });
      expect(read).not.toHaveBeenCalled();
    });

    it('names the sources it could not read', async () => {
      bridge({ checked: { missed: ['SHOP-878'] } });
      const { result } = render();

      act(() => {
        result.current.onCheck();
      });

      await waitFor(() => {
        expect(result.current.notice?.text).toBe('Could not read SHOP-878.');
      });
    });

    it('shows what changed, and offers to propose the swaps or keep the plan', async () => {
      bridge({ checked: { changes: [FOUND], snapshots: CHANGED.snapshots } });
      const { result, rerender } = render();

      act(() => {
        result.current.onCheck();
      });

      await waitFor(() => {
        expect(now()?.changed?.found).toEqual([FOUND]);
      });
      rerender();

      expect(result.current).toMatchObject({
        changedLines: ['SHOP-878 changed after this plan.'],
        canPropose: true,
        canCheck: false,
      });
    });

    it('says a story got new comments when only comments came', () => {
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([CASE]),
            changed: {
              ...CHANGED,
              found: [
                {
                  ...FOUND,
                  after: FOUND.before,
                  comments: [{ author: 'Rui', at: '2026-11-13', text: 'Agora 5.' }],
                },
                {
                  kind: 'code',
                  repository: 'shop/web',
                  branch: 'feat/coupon',
                  from: 'a',
                  to: 'b',
                  files: [],
                },
              ],
            },
          },
        ],
      });

      expect(render().result.current.changedLines).toEqual([
        'SHOP-878 got 1 new comment after this plan.',
        'The branch feat/coupon moved after this plan.',
      ]);
    });

    it('keeps the plan as it is, and takes how the sources read now as its baseline', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace([CASE]), snapshots: [SNAP], changed: CHANGED }],
      });

      const { result } = render();

      act(() => {
        result.current.onKeep();
      });

      expect(now()).not.toHaveProperty('changed');
      expect(now()?.snapshots).toEqual(CHANGED.snapshots);
      expect(now()?.plan).toEqual([CASE]);
    });
  });

  describe('proposing the swaps', () => {
    beforeEach(() => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace([CASE]), issue: ISSUE, snapshots: [SNAP], changed: CHANGED },
        ],
      });
    });

    it('asks the agent, on the click, with what changed and the cases, and opens the review', async () => {
      const read = bridge({});
      const { result, rerender } = render();

      act(() => {
        result.current.onPropose();
      });

      await waitFor(() => {
        expect(now()?.review?.items).toHaveLength(2);
      });
      rerender();

      expect(read.mock.calls[0]?.[0]).toMatchObject({
        workspaceId: 'w1',
        brief: { changes: [FOUND], language: 'pt' },
      });
      expect(result.current.summary).toBe('O critério 3 passou de 3 para 5 tentativas.');
      expect(result.current.items[0]).toMatchObject({
        title: 'TC-04 Cupom inválido bloqueia',
        text: 'Why: C3 diz 5',
        before: ['1. Errar o cupom 3 vezes → Tente de novo mais tarde'],
        after: [
          {
            line: '1. Errar o cupom 5 vezes → Tente de novo mais tarde',
            isChanged: true,
          },
        ],
      });
    });

    it('resolves a change that touches no case, and says so', async () => {
      bridge({
        reading: {
          isRead: true,
          read: {
            summary: 'Só mudou o texto de ajuda.',
            changes: [],
            added: [],
            doubts: [],
            answered: [],
          },
        },
      });
      const { result } = render();

      act(() => {
        result.current.onPropose();
      });

      await waitFor(() => {
        expect(result.current.notice?.text).toBe('Só mudou o texto de ajuda.');
      });
      expect(now()).not.toHaveProperty('changed');
    });

    it('says when no agent is ready to read the change', async () => {
      bridge({ reading: { isRead: false, reason: 'agent-missing' } });
      const { result } = render();

      act(() => {
        result.current.onPropose();
      });

      await waitFor(() => {
        expect(result.current.notice?.text).toBe(
          'No coding agent is ready on this machine to read the change.',
        );
      });
    });
  });

  /** A reunião entra no lugar do "depois", e o resultado é a mesma revisão. */
  describe('reading a meeting', () => {
    it('reads the transcript as a change, on the click, and opens the review', async () => {
      const read = bridge({});
      const { result, rerender } = render();

      expect(result.current.canMeet).toBe(true);

      act(() => {
        result.current.onMeet();
      });
      rerender();

      expect(result.current.isMeeting).toBe(true);

      act(() => {
        result.current.onMeeting({
          name: 'alinhamento.vtt',
          text: 'Rui: fica 5 tentativas.',
        });
      });

      await waitFor(() => {
        expect(now()?.review?.items).toHaveLength(2);
      });
      rerender();

      expect(read.mock.calls[0]?.[0].brief.changes).toEqual([
        expect.objectContaining({
          kind: 'meeting',
          name: 'alinhamento.vtt',
          text: 'Rui: fica 5 tentativas.',
        }),
      ]);
      expect(result.current.note).toMatch(/^Decided in the meeting “alinhamento\.vtt”: /);

      act(() => {
        result.current.onDone();
      });

      expect(now()?.snapshots).toEqual([SNAP]);
    });
  });

  describe('the review', () => {
    beforeEach(() => {
      bridge({});
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace([CASE]),
            issue: ISSUE,
            snapshots: [SNAP],
            changed: CHANGED,
            review: reviewOf({ read: READ, at: '2026-11-13T15:00:00.000Z' }),
          },
        ],
      });
    });

    it('applies a swap to the case, and a doubt to the doubts of the plan', () => {
      const { result, rerender } = render();

      act(() => {
        result.current.onApply('R1');
      });
      rerender();
      act(() => {
        result.current.onApply('R2');
      });

      expect(now()?.plan[0]?.steps[0]?.action).toBe('Errar o cupom 5 vezes');
      expect(now()?.doubts).toEqual([
        { id: 'D1', question: 'O bloqueio dura quanto?', sent: null, answer: null },
      ]);
      expect(now()?.review?.items.map(({ state }) => state)).toEqual([
        'applied',
        'applied',
      ]);
    });

    it('refuses a swap with the reason the QA picked, and leaves the case', () => {
      const { result, rerender } = render();

      act(() => {
        result.current.onRefuse('R1');
      });
      rerender();

      expect(result.current.items[0]?.isRefusing).toBe(true);

      act(() => {
        result.current.onRefusal({ id: 'R1', reason: 'wrong-read' });
      });

      expect(now()?.review?.items[0]).toMatchObject({
        state: 'refused',
        refusal: 'wrong-read',
      });
      expect(now()?.plan).toEqual([CASE]);
    });

    it('applies them all at once, then offers to tell the story or be done', () => {
      const { result, rerender } = render();

      act(() => {
        result.current.onApplyAll();
      });
      rerender();

      expect(result.current).toMatchObject({ isDone: true, canTell: true });
      expect(result.current.note).toBe(
        [
          'I updated the test plan for this change: O critério 3 passou de 3 para 5 tentativas.',
          '- TC-04 Cupom inválido bloqueia: C3 diz 5',
          '- Doubt: O bloqueio dura quanto?',
        ].join('\n'),
      );
    });

    it('takes how the sources read now as the baseline once the QA is done', () => {
      const { result, rerender } = render();

      act(() => {
        result.current.onApplyAll();
      });
      rerender();
      act(() => {
        result.current.onDone();
      });

      expect(now()).not.toHaveProperty('review');
      expect(now()).not.toHaveProperty('changed');
      expect(now()?.snapshots).toEqual(CHANGED.snapshots);
    });

    it('resolves the change once the story is told, and says where the comment went', () => {
      const { result } = render();

      act(() => {
        result.current.onTold(
          'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=1',
        );
      });

      expect(now()).not.toHaveProperty('review');
      expect(result.current.notice).toMatchObject({
        text: 'Comment posted on SHOP-878.',
        url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=1',
      });
    });

    it('does NOT change anything while a run walks the plan', () => {
      const { result } = render({ isLocked: true });

      act(() => {
        result.current.onApply('R1');
      });

      expect(now()?.plan).toEqual([CASE]);
      expect(result.current.items[0]?.isOpen).toBe(false);
    });
  });
});

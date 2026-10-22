// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { filingPlanOf } from '@/modules/Bug/library';
import { useBugsViewModel } from '@/modules/Bug/screens/Bugs/hooks/useBugsViewModel';
import { recordedRun, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const WORKSPACE = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
  isFinished: true,
});
const BUG = WORKSPACE.bugs[0]!;

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [{ ...WORKSPACE, bugs: [BUG] }],
    openBugId: null,
    bugFilter: 'all',
  });
});

afterEach(async () => {
  Reflect.deleteProperty(window, 'qazinho');
  await i18n.changeLanguage('en');
});

describe('useBugsViewModel', () => {
  it('counts the bugs in the singular when there is only one', () => {
    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.summary).toBe('1 bug, caught by the agent');
  });

  it('has nothing to show while nothing has broken', () => {
    useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, bugs: [] }] });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.isEmpty).toBe(true);
  });

  describe('onFilter', () => {
    it('offers every severity by name, with the one in use marked', async () => {
      await i18n.changeLanguage('pt');

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.filters).toEqual([
        { id: 'all', label: 'todos', isActive: true },
        { id: 'high', label: 'alta', isActive: false },
        { id: 'medium', label: 'média', isActive: false },
        { id: 'low', label: 'baixa', isActive: false },
      ]);
    });

    it('keeps the bugs of that severity', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onFilter('high');
      });

      expect(result.current.bugs).toHaveLength(1);
    });

    it('shows none when no bug carries that severity', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onFilter('low');
      });

      expect(result.current.bugs).toEqual([]);
    });
  });

  describe('onOpenRun', () => {
    it('opens the Runs tab on the run the bug was caught in', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onOpenRun('r-01');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        tab: 'runs',
        selectedRunId: 'r-01',
      });
    });

    /**
     * Before runs that ended early were kept, a stopped run left its bugs pointing at nothing,
     * and those bugs are still on disk.
     */
    it('does NOT offer a run that is not there', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, bugs: [BUG], runs: [] }],
      });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.bugs[0]?.hasRun).toBe(false);
    });
  });

  describe('onOpenCase', () => {
    it('goes to the plan with the bug’s case open', () => {
      useWorkspaceStore.setState({ openCaseId: null, tab: 'bugs' });

      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onOpenCase('TC-02');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        tab: 'plan',
        openCaseId: 'TC-02',
      });
    });

    it('does NOT close the case when it was open already', () => {
      useWorkspaceStore.setState({ openCaseId: 'TC-02', tab: 'bugs' });

      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onOpenCase('TC-02');
      });

      expect(useWorkspaceStore.getState().openCaseId).toBe('TC-02');
    });

    it('offers only a case the plan has, and none for a bug an exploration found', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...WORKSPACE, bugs: [BUG, { ...BUG, id: 'BUG-02', caseId: 'EX' }] },
        ],
      });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.bugs.map(({ hasCase }) => hasCase)).toEqual([true, false]);
    });
  });

  describe('onToggleBug', () => {
    it('opens a bug and closes it again', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onToggleBug('BUG-01');
      });

      expect(useWorkspaceStore.getState().openBugId).toBe('BUG-01');

      act(() => {
        result.current.onToggleBug('BUG-01');
      });

      expect(useWorkspaceStore.getState().openBugId).toBeNull();
    });
  });

  it("places a bug in its run's video, a moment that the card can show", () => {
    useWorkspaceStore.setState({ workspaces: [recordedRun()] });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.bugs[0]?.moment).toEqual({
      workspaceId: 'w1',
      runId: 'r-01',
      atMs: 9_500,
    });
  });

  it('has no moment to show for a bug whose run has no video', () => {
    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.bugs[0]?.moment).toBeNull();
  });

  describe('a bug seen again', () => {
    const SIGHTING = {
      runId: 'r-02',
      runWhen: '10:05',
      caseId: 'TC-02',
      stepNumber: 2,
      at: 1_760_000_100_000,
      shot: { isBad: true, src: null, file: '/tmp/qazinho/r-02/step-5.jpg' },
    };

    it('points it at the latest run that caught it, and the moment there', () => {
      const recorded = recordedRun();
      const [first] = recorded.runs;
      const [bug] = recorded.bugs;

      useWorkspaceStore.setState({
        workspaces: [
          {
            ...recorded,
            runs: [
              first!,
              {
                ...first!,
                id: 'r-02',
                video: { ...first!.video!, startedAt: 1_760_000_090_000 },
              },
            ],
            bugs: [{ ...bug!, sightings: [SIGHTING] }],
          },
        ],
      });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.bugs[0]).toMatchObject({
        lastRunId: 'r-02',
        hasRun: true,
        moment: { workspaceId: 'w1', runId: 'r-02', atMs: 10_000 },
      });
    });

    it('keeps the run it was first caught in when the later one is gone', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, bugs: [{ ...BUG, sightings: [SIGHTING] }] }],
      });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.bugs[0]).toMatchObject({ lastRunId: 'r-01', hasRun: true });
    });
  });

  describe('onSend', () => {
    it('opens the bug to send, and closes it when the QA cancels', () => {
      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.sending).toBeNull();

      act(() => {
        result.current.onSend(BUG.id);
      });

      expect(result.current.sending).toEqual({ workspaceId: 'w1', bug: BUG });

      act(() => {
        result.current.onCancelSend();
      });

      expect(result.current.sending).toBeNull();
    });

    it('sends the bug where the QA picked, and follows it in its popup', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        fileBug: vi.fn().mockResolvedValue({
          isFiled: false,
          failure: 'not-connected',
          said: '',
        }),
      };

      const { result } = renderHook(() => useBugsViewModel());
      const target = { tracker: 'jira' as const, project: 'SHOP' };

      act(() => {
        result.current.onSend(BUG.id);
      });
      act(() => {
        result.current.onSendTo({
          target,
          title: 'Typed title',
          plan: filingPlanOf({ workspace: WORKSPACE, bug: BUG, tracker: 'jira' }),
        });
      });

      expect(result.current.sending).toBeNull();
      expect(result.current.filing?.bug).toBe(BUG);

      await waitFor(() => {
        expect(result.current.filing?.filing.result).toEqual({
          isFiled: false,
          failure: 'not-connected',
          said: '',
        });
      });

      act(() => {
        result.current.onCloseFiling();
      });

      expect(result.current.filing).toBeNull();
    });
  });
});

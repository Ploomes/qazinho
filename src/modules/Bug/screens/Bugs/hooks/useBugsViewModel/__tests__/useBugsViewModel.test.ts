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
    bugFilter: 'open',
  });
});

afterEach(async () => {
  Reflect.deleteProperty(window, 'qazinho');
  await i18n.changeLanguage('en');
});

describe('useBugsViewModel', () => {
  it('counts the bugs in the singular when there is only one', () => {
    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.summary).toBe('1 open.');
  });

  it('has nothing to show while nothing has broken', () => {
    useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, bugs: [] }] });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.isEmpty).toBe(true);
  });

  describe('the tabs', () => {
    const FILED = {
      ...BUG,
      id: 'BUG-02',
      filed: { tracker: 'jira' as const, key: 'SHOP-9', url: 'https://x.test/9', at: '' },
    };

    it('opens on the open bugs, counted, and offers a tab only where there is a bug', () => {
      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.tabs).toMatchObject([
        { id: 'open', label: 'Open', count: '1', isActive: true },
      ]);
      expect(result.current.rows.map(({ id }) => id)).toEqual([BUG.id]);
    });

    it('keeps a sent bug under Sent, and says how many went', () => {
      useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, bugs: [BUG, FILED] }] });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.summary).toBe('1 open. 1 was already sent.');

      act(() => {
        result.current.tabs.find(({ id }) => id === 'filed')?.onClick();
      });

      expect(result.current.rows.map(({ id }) => id)).toEqual(['BUG-02']);
    });

    it('says where each bug was caught and how many runs saw it', () => {
      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.rows[0]).toMatchObject({
        title: BUG.title,
        where: 'Step 2 of TC-02',
        seen: 'seen in 1 run',
      });
    });
  });

  describe('onDismiss', () => {
    it('takes a bug the QA says is none out of the open ones, and keeps it under Closed', () => {
      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.tabs.map(({ id }) => id)).not.toContain('dismissed');

      act(() => {
        result.current.onDismiss({ bugId: BUG.id, isDismissed: true });
      });

      expect(result.current.rows).toEqual([]);
      expect(result.current.summary).toBe('None open.');
      expect(result.current.isEmpty).toBe(false);

      act(() => {
        result.current.tabs.find(({ id }) => id === 'dismissed')?.onClick();
      });

      expect(result.current.rows.map(({ id }) => id)).toEqual([BUG.id]);
    });

    it('does NOT stay on an empty tab once every bug was opened again', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, bugs: [{ ...BUG, isDismissed: true }] }],
        bugFilter: 'dismissed',
      });

      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onDismiss({ bugId: BUG.id, isDismissed: false });
      });

      expect(result.current.rows.map(({ id }) => id)).toEqual([BUG.id]);
      expect(result.current.tabs.map(({ id }) => id)).toEqual(['open']);
    });
  });

  describe('onOpenRun', () => {
    it('opens the Runs tab on the run the bug was caught in', () => {
      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onOpenRun('r-01');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        panelTab: 'runs',
        selectedRunId: 'r-01',
      });
    });

    /**
     * Antes de as runs que terminaram cedo serem guardadas, uma run parada deixava os
     * bugs dela apontando para nada, e esses bugs ainda estão no disco.
     */
    it('does NOT offer a run that is not there', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, bugs: [BUG], runs: [] }],
      });

      useWorkspaceStore.setState({ openBugId: BUG.id });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.page?.hasRun).toBe(false);
    });
  });

  describe('onOpenCase', () => {
    it('goes to the plan with the bug’s case open', () => {
      useWorkspaceStore.setState({ openCaseId: null, panelTab: 'bugs' });

      const { result } = renderHook(() => useBugsViewModel());

      act(() => {
        result.current.onOpenCase('TC-02');
      });

      expect(useWorkspaceStore.getState()).toMatchObject({
        panelTab: 'plan',
        openCaseId: 'TC-02',
      });
    });

    it('does NOT close the case when it was open already', () => {
      useWorkspaceStore.setState({ openCaseId: 'TC-02', panelTab: 'bugs' });

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

      useWorkspaceStore.setState({ openBugId: 'BUG-02' });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.page?.hasCase).toBe(false);
    });
  });

  describe('a bug opened', () => {
    it('opens as its page from its row, and goes back to every bug', () => {
      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.page).toBeNull();

      act(() => {
        result.current.rows[0]?.onOpen();
      });

      expect(result.current.page?.bug.id).toBe('BUG-01');

      act(() => {
        result.current.onBack();
      });

      expect(result.current.page).toBeNull();
    });
  });

  it("places a bug in its run's video, a moment that the card can show", () => {
    const recorded = recordedRun();

    useWorkspaceStore.setState({
      workspaces: [recorded],
      openBugId: recorded.bugs[0]?.id ?? null,
    });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.page?.moment).toEqual({
      workspaceId: 'w1',
      runId: 'r-01',
      atMs: 9_500,
    });
  });

  it('has no moment to show for a bug whose run has no video', () => {
    useWorkspaceStore.setState({ openBugId: BUG.id });

    const { result } = renderHook(() => useBugsViewModel());

    expect(result.current.page?.moment).toBeNull();
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
        openBugId: bug!.id,
      });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.page).toMatchObject({
        lastRunId: 'r-02',
        hasRun: true,
        moment: { workspaceId: 'w1', runId: 'r-02', atMs: 10_000 },
      });
    });

    it('keeps the run it was first caught in when the later one is gone', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...WORKSPACE, bugs: [{ ...BUG, sightings: [SIGHTING] }] }],
        openBugId: BUG.id,
      });

      const { result } = renderHook(() => useBugsViewModel());

      expect(result.current.page).toMatchObject({ lastRunId: 'r-01', hasRun: true });
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

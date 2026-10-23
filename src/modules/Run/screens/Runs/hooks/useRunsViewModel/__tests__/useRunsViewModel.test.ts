// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useRunsViewModel } from '@/modules/Run/screens/Runs/hooks/useRunsViewModel';
import { endRun, landCost } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  recordedRun,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

function finishedWorkspace() {
  return walkRun({
    verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
    isFinished: true,
  });
}

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [finishedWorkspace()],
    selectedRunId: null,
  });
});

describe('useRunsViewModel', () => {
  it('opens on the newest run without being asked', () => {
    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.run?.id).toBe('r-01');
  });

  it('names the run and what it walked in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.title).toBe('Run r-01 · o plano inteiro');
    expect(result.current.runs[0]?.what).toBe('O plano inteiro');
    await i18n.changeLanguage('en');
  });

  it('marks a run that ended before the end, and leaves a finished one plain', () => {
    const stopped = endRun({
      workspace: walkRun({ verdicts: ['passed', 'failed'] }),
      at: '09:43',
      endedBy: 'stopped',
    });

    expect(renderHook(() => useRunsViewModel()).result.current.runEnded).toBeNull();

    useWorkspaceStore.setState({ workspaces: [stopped] });

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.runEnded).toEqual({ icon: 'stopped', label: 'stopped' });
    expect(result.current.runs[0]?.ended).toEqual({ icon: 'stopped', label: 'stopped' });
  });

  it('has nothing to show before the first run', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.run).toBeNull();
  });

  describe('summary', () => {
    it('says how many cases ran, how each kind went, and the bugs it caught', () => {
      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.summary).toEqual({
        lead: '2 cases',
        tallies: [
          { status: 'passed', icon: 'passed', label: '1 passed' },
          { status: 'failed', icon: 'failed', label: '1 failed' },
        ],
        bugs: '1 bug',
      });
    });

    it('does NOT name a verdict no case had, nor bugs when none was caught', () => {
      useWorkspaceStore.setState({
        workspaces: [
          walkRun({
            verdicts: ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'],
            isFinished: true,
          }),
        ],
      });

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.summary.tallies.map(({ status }) => status)).toEqual([
        'passed',
      ]);
      expect(result.current.summary.bugs).toBeNull();
    });

    it('counts the screens of an exploration, which has no cases to tally', () => {
      const workspace = finishedWorkspace();
      const runs = workspace.runs.map((run) => ({ ...run, kind: 'explore' as const }));

      useWorkspaceStore.setState({ workspaces: [{ ...workspace, runs }] });

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.summary.lead).toBe('6 screens');
      expect(result.current.summary.tallies).toEqual([]);
    });
  });

  it('lists in the picker only the verdicts a run had, steps counted', () => {
    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.runs[0]?.tallies).toEqual([
      { status: 'passed', icon: 'passed', count: 4 },
      { status: 'failed', icon: 'failed', count: 1 },
      { status: 'skipped', icon: 'skipped', count: 1 },
    ]);
  });

  describe('cases', () => {
    it('puts the case that failed first and open, the one that passed after it and folded', () => {
      const { result } = renderHook(() => useRunsViewModel());

      expect(
        result.current.cases.map(({ id, isOpen, isFirstPassed }) => [
          id,
          isOpen,
          isFirstPassed,
        ]),
      ).toEqual([
        ['TC-02', true, false],
        ['TC-01', false, true],
      ]);
    });

    it('opens a folded case and folds an open one on asking', () => {
      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.cases[1]?.onToggle();
      });
      act(() => {
        result.current.cases[0]?.onToggle();
      });

      expect(result.current.cases.map(({ isOpen }) => isOpen)).toEqual([false, true]);
    });

    it('does NOT head the passed cases apart when every case passed', () => {
      useWorkspaceStore.setState({
        workspaces: [
          walkRun({
            verdicts: ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'],
            isFinished: true,
          }),
        ],
      });

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.cases.some(({ isFirstPassed }) => isFirstPassed)).toBe(false);
    });

    it('keeps the screens of an exploration open', () => {
      const workspace = walkRun({
        verdicts: ['passed', 'passed', 'passed'],
        isFinished: true,
      });
      const runs = workspace.runs.map((run) => ({ ...run, kind: 'explore' as const }));

      useWorkspaceStore.setState({ workspaces: [{ ...workspace, runs }] });

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.cases.every(({ isOpen }) => isOpen)).toBe(true);
    });

    it('marks only the steps that did not pass', () => {
      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.cases[0]?.steps.map(({ mark }) => mark)).toEqual([
        null,
        'failed',
        'skipped',
      ]);
    });
  });

  it('puts the bug on the step that caught it, instead of the agent note', () => {
    const { result } = renderHook(() => useRunsViewModel());
    const failed = result.current.cases[0]?.steps.find(
      ({ verdict }) => verdict === 'failed',
    );

    expect(failed?.bug?.id).toBe('BUG-01');
    expect(failed?.hasNote).toBe(false);
  });

  it('marks a case walked again without the agent, and says what it checked on screen', () => {
    const replayed = finishedWorkspace();
    const [run] = replayed.runs;

    if (run === undefined) throw new Error('fixture');

    useWorkspaceStore.setState({
      workspaces: [
        {
          ...replayed,
          runs: [
            {
              ...run,
              cases: run.cases.map((runCase, position) => ({
                ...runCase,
                steps: runCase.steps.map((step) =>
                  position === 0
                    ? { ...step, by: 'replay' as const, proof: 'Visits: 1', why: null }
                    : { ...step, by: 'healed' as const },
                ),
              })),
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useRunsViewModel());
    const [second, first] = result.current.cases;

    expect(first?.walk).toMatchObject({
      label: 'no AI',
      className: 'runs__walk runs__walk--replay',
    });
    expect(first?.steps[0]).toMatchObject({
      hasNote: true,
      note: 'checked on screen: “Visits: 1”',
    });
    expect(second?.walk).toMatchObject({ label: 'healed' });
  });

  it('does NOT mark a case the agent walked on its own', () => {
    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.cases.map(({ walk }) => walk)).toEqual([null, null]);
  });

  it('puts what the agent asked the QA on the step it asked at, with the answer', () => {
    const asked = finishedWorkspace();
    const [run] = asked.runs;

    useWorkspaceStore.setState({
      workspaces: [
        {
          ...asked,
          runs: run
            ? [
                {
                  ...run,
                  asked: [
                    {
                      id: 'q-1',
                      question: 'Which plan should I pick?',
                      caseId: 'TC-01',
                      stepNumber: 2,
                      answer: { kind: 'said', text: 'Premium+' },
                      askedAtMs: 1,
                      answeredAtMs: 2,
                    },
                    {
                      id: 'q-2',
                      question: 'What is the code?',
                      caseId: 'TC-02',
                      stepNumber: 1,
                      answer: { kind: 'secret', name: 'OTP_CODE', isKept: false },
                      askedAtMs: 3,
                      answeredAtMs: 4,
                    },
                  ],
                },
              ]
            : [],
        },
      ],
    });

    const { result } = renderHook(() => useRunsViewModel());
    const steps = result.current.cases.flatMap((runCase) =>
      runCase.steps.map((step) => ({ caseId: runCase.id, ...step })),
    );

    expect(
      steps
        .filter(({ asked }) => asked.length > 0)
        .map(({ caseId, number, asked }) => [
          caseId,
          number,
          asked.map(({ question, answer, isSecret }) => ({ question, answer, isSecret })),
        ]),
    ).toEqual([
      [
        'TC-02',
        1,
        [
          {
            question: 'What is the code?',
            answer: 'a secret, typed as ${OTP_CODE}',
            isSecret: true,
          },
        ],
      ],
      [
        'TC-01',
        2,
        [{ question: 'Which plan should I pick?', answer: 'Premium+', isSecret: false }],
      ],
    ]);
  });

  it('mutes a step that never ran, and keeps its note', () => {
    const { result } = renderHook(() => useRunsViewModel());
    const skipped = result.current.cases[0]?.steps.find(
      ({ verdict }) => verdict === 'skipped',
    );

    expect(skipped?.isMuted).toBe(true);
    expect(skipped?.hasNote).toBe(true);
  });

  it('does NOT call a case failed when nothing in it failed, even if the saved run says so', () => {
    const workspace = walkRun({
      verdicts: ['passed', 'passed', 'passed', 'passed', 'blocked', 'skipped'],
      isFinished: true,
    });
    const runs = workspace.runs.map((run) => ({
      ...run,
      cases: run.cases.map((runCase) => ({ ...runCase, verdict: 'failed' as const })),
    }));
    useWorkspaceStore.setState({ workspaces: [{ ...workspace, runs }] });

    const { result } = renderHook(() => useRunsViewModel());

    expect(result.current.cases[0]?.verdict).toBe('blocked');
  });

  describe('onOpenBug', () => {
    it('hands the QA over to the bug it clicked', () => {
      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onOpenBug('BUG-01');
      });

      expect(useWorkspaceStore.getState().tab).toBe('bugs');
      expect(useWorkspaceStore.getState().openBugId).toBe('BUG-01');
    });
  });

  describe('onSelectRun', () => {
    it('opens the run it was given', () => {
      const workspace = finishedWorkspace();
      const [first] = workspace.runs;
      const runs = [{ ...first!, id: 'r-02' }, first!];

      useWorkspaceStore.setState({
        workspaces: [{ ...workspace, runs }],
      });

      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onSelectRun('r-01');
      });

      expect(result.current.run?.id).toBe('r-01');
    });
  });

  describe('onNextPage', () => {
    function manyRuns(count: number) {
      const workspace = finishedWorkspace();
      const [first] = workspace.runs;
      const runs = Array.from({ length: count }, (_, index) => ({
        ...first!,
        id: `r-${String(count - index).padStart(2, '0')}`,
      }));

      useWorkspaceStore.setState({ workspaces: [{ ...workspace, runs }] });
    }

    it('pages the history five runs at a time, newest first', () => {
      manyRuns(12);

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.runs.map(({ id }) => id)).toEqual([
        'r-12',
        'r-11',
        'r-10',
        'r-09',
        'r-08',
      ]);
      expect(result.current.pager).toMatchObject({
        isShown: true,
        label: '1–5 of 12 runs',
        canGoBack: false,
        canGoOn: true,
      });

      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.runs[0]?.id).toBe('r-07');
      expect(result.current.pager.canGoBack).toBe(true);
    });

    it('does NOT show a pager while every run fits on one page', () => {
      manyRuns(3);

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.pager.isShown).toBe(false);
    });

    it('counts every run for the picker, not only the page in its list', () => {
      manyRuns(12);

      const { result } = renderHook(() => useRunsViewModel());

      act(() => {
        result.current.onNextPage();
      });

      expect(result.current.runs).toHaveLength(5);
      expect(result.current.runTotal).toBe(12);
    });
  });

  describe('current', () => {
    it('puts the run on show at the top, with how long it took and what it cost', () => {
      const paid = landCost({
        workspace: walkRun({ verdicts: ['passed'] }),
        costUsd: 0.25,
      });

      useWorkspaceStore.setState({
        workspaces: [endRun({ workspace: paid, at: '09:42', endedBy: 'finished' })],
      });

      expect(renderHook(() => useRunsViewModel()).result.current.current).toMatchObject({
        id: 'r-01',
        isSelected: true,
        facts: '0:00 · $0.25',
      });
    });
  });

  describe('onToTop', () => {
    it('does NOT offer the way back up while the picker is in view', () => {
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      });

      expect(renderHook(() => useRunsViewModel()).result.current.isToTopShown).toBe(
        false,
      );
    });
  });

  describe('onWatch', () => {
    it('offers to watch a run that was recorded, and opens it whole', () => {
      useWorkspaceStore.setState({ workspaces: [recordedRun()] });

      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.canWatch).toBe(true);
      expect(result.current.watchLabel).toBe('Watch the run');

      act(() => {
        result.current.onWatch();
      });

      expect(useAppStore.getState().replay).toEqual({
        workspaceId: 'w1',
        runId: 'r-01',
        focus: { kind: 'run' },
      });
      useAppStore.setState({ replay: null });
    });

    it('does NOT offer to watch a run that has no video', () => {
      const { result } = renderHook(() => useRunsViewModel());

      expect(result.current.canWatch).toBe(false);
      expect(result.current.cases.every(({ take }) => take === null)).toBe(true);
    });
  });

  describe('take', () => {
    it("opens a case's own take from the case", () => {
      useWorkspaceStore.setState({ workspaces: [recordedRun()] });

      const { result } = renderHook(() => useRunsViewModel());
      const take = result.current.cases[0]?.take;

      expect(take?.title).toBe('Watch the take of TC-02');

      act(() => {
        take?.onClick();
      });

      expect(useAppStore.getState().replay?.focus).toEqual({
        kind: 'case',
        caseId: 'TC-02',
      });
      useAppStore.setState({ replay: null });
    });
  });
});

// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useBugCardViewModel } from '@/modules/Bug/screens/Bugs/components/BugCard/hooks/useBugCardViewModel';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSettingsStore, useWorkspaceStore } from '@/store';

const WORKSPACE = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
  isFinished: true,
});
const BUG = WORKSPACE.bugs[0]!;
const PROPS = {
  workspaceId: 'w1',
  bug: BUG,
  isOpen: false,
  hasRun: true,
  hasCase: true,
  lastRunId: 'r-01',
  moment: null,
  onToggle: vi.fn(),
  onOpenRun: vi.fn(),
  onOpenCase: vi.fn(),
  onSend: vi.fn(),
  onDismiss: vi.fn(),
};

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useBugCardViewModel', () => {
  it('says where the bug came from, so a developer can find it again', () => {
    const { result } = renderHook(() => useBugCardViewModel(PROPS));

    expect(result.current.meta.map(({ key }) => key)).toEqual([
      'run',
      'case',
      'target',
      'seen',
      'agent',
    ]);
    expect(result.current.meta[1]?.value).toBe('TC-02 · step 2');
  });

  it('names the agent and the model that caught it, not the ones picked now', () => {
    useSettingsStore.setState({ agent: 'Codex', model: '' });

    const { result } = renderHook(() =>
      useBugCardViewModel({
        ...PROPS,
        bug: { ...BUG, agent: 'Claude Code', modelName: 'Opus' },
      }),
    );

    expect(result.current.meta.find(({ key }) => key === 'agent')?.value).toBe(
      'Claude Code · Opus',
    );
  });

  it("says the agent's own default when it named no model", () => {
    const { result } = renderHook(() =>
      useBugCardViewModel({ ...PROPS, bug: { ...BUG, modelName: null } }),
    );

    expect(result.current.meta.find(({ key }) => key === 'agent')?.value).toBe(
      'Claude Code · Agent default',
    );
  });

  it('shows how bad a bug is in bars, one for low, two for medium and three for high', () => {
    const barsOf = (severity: 'low' | 'medium' | 'high') =>
      renderHook(() => useBugCardViewModel({ ...PROPS, bug: { ...BUG, severity } }))
        .result.current;

    expect(barsOf('low').levelBars.filter(({ isOn }) => isOn)).toHaveLength(1);
    expect(barsOf('medium').levelBars.filter(({ isOn }) => isOn)).toHaveLength(2);
    expect(barsOf('high').levelBars.filter(({ isOn }) => isOn)).toHaveLength(3);
    expect(barsOf('medium').cardClass).toBe('bug-card bug-card--medium');
  });

  it('does NOT make up who caught an older bug that never said', () => {
    const { result } = renderHook(() =>
      useBugCardViewModel({ ...PROPS, bug: { ...BUG, agent: '', modelName: null } }),
    );

    expect(result.current.meta.map(({ key }) => key)).not.toContain('agent');
  });

  it('writes every label and word on the card in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useBugCardViewModel(PROPS));

    expect(result.current.meta.map(({ label }) => label)).toEqual([
      'run',
      'caso',
      'alvo',
      'visto',
      'agente',
    ]);
    expect(result.current.meta[1]?.value).toBe('TC-02 · passo 2');
    expect(result.current.meta[3]?.value).toBe('uma vez');
    expect(result.current.severity).toBe('alta');
    expect(result.current.cardClass).toBe('bug-card bug-card--high');
    expect(result.current.levelBars.filter(({ isOn }) => isOn)).toHaveLength(3);
    expect(result.current.shots.map(({ label }) => label)).toEqual([
      'antes',
      'o passo que quebrou',
    ]);
    expect(result.current.runLabel).toBe('Ir para a run r-01');
    expect(result.current.caseLabel).toBe('Ir para o caso TC-02');
  });

  it('counts the runs that caught it once there is more than one', () => {
    const { result } = renderHook(() =>
      useBugCardViewModel({ ...PROPS, bug: { ...BUG, seenRuns: 3 } }),
    );

    expect(result.current.meta[3]?.value).toBe('in 3 runs');
  });

  it('goes to the run the bug was caught in, named as a run', () => {
    const onOpenRun = vi.fn();
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onOpenRun }));

    result.current.onRunClick();

    expect(onOpenRun).toHaveBeenCalledWith('r-01');
    expect(result.current.runLabel).toBe('Go to run r-01');
    expect(result.current.hasRun).toBe(true);
    expect(result.current.newLabel).toBe('just caught');
  });

  it('goes to the case the bug was caught on, named as a case', () => {
    const onOpenCase = vi.fn();
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onOpenCase }));

    result.current.onCaseClick();

    expect(onOpenCase).toHaveBeenCalledWith('TC-02');
    expect(result.current.caseLabel).toBe('Go to case TC-02');
    expect(result.current.hasCase).toBe(true);
  });

  it('does NOT offer a case the plan does not have', () => {
    const { result } = renderHook(() =>
      useBugCardViewModel({ ...PROPS, hasCase: false }),
    );

    expect(result.current.hasCase).toBe(false);
  });

  describe('a bug off the design', () => {
    const DESIGN = {
      url: 'https://www.figma.com/design/AbC123/Shop?node-id=1-2',
      fileKey: 'AbC123',
      nodeId: '1:2',
      name: 'Shop',
    };
    const OFF = { ...PROPS, bug: { ...BUG, frame: '12:345' } };

    afterEach(() => {
      useWorkspaceStore.setState({ workspaces: [] });
      vi.restoreAllMocks();
    });

    it('says it is off the design, and opens the frame it differs from', () => {
      const open = vi.spyOn(window, 'open').mockReturnValue(null);

      useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, design: DESIGN }] });

      const { result } = renderHook(() => useBugCardViewModel(OFF));

      expect(result.current.offDesign).toBe('off the design');
      expect(result.current.frameLabel).toBe('See the frame in Figma');

      act(() => {
        result.current.onFrameClick();
      });

      expect(open).toHaveBeenCalledWith(
        'https://www.figma.com/design/AbC123/Shop?node-id=12-345',
        '_blank',
        'noreferrer',
      );
    });

    it('does NOT offer a frame once the workspace has no design, and nothing for any other bug', () => {
      useWorkspaceStore.setState({ workspaces: [{ ...WORKSPACE, design: null }] });

      expect(renderHook(() => useBugCardViewModel(OFF)).result.current).toMatchObject({
        offDesign: 'off the design',
        frameLabel: null,
      });
      expect(renderHook(() => useBugCardViewModel(PROPS)).result.current).toMatchObject({
        offDesign: null,
        frameLabel: null,
      });
    });
  });

  describe('a bug seen again', () => {
    const AGAIN = {
      ...BUG,
      seenRuns: 2,
      sightings: [
        {
          runId: 'r-02',
          runWhen: '10:05',
          caseId: 'TC-02',
          stepNumber: 2,
          at: 1_760_000_100_000,
          shot: { isBad: true, src: null, file: '/tmp/qazinho/r-02/step-5.jpg' },
        },
      ],
    };

    it('says when it was last seen, after how many runs saw it', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({ ...PROPS, bug: AGAIN, lastRunId: 'r-02' }),
      );

      expect(result.current.meta.map(({ key }) => key)).toEqual([
        'run',
        'case',
        'target',
        'seen',
        'last',
        'agent',
      ]);
      expect(result.current.meta[3]?.value).toBe('in 2 runs');
      expect(result.current.meta[4]?.value).toBe('r-02 · 10:05');
    });

    it('shows the screen of each time it came back, after the first ones', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({ ...PROPS, bug: AGAIN, lastRunId: 'r-02' }),
      );

      expect(result.current.shots.map(({ label }) => label)).toEqual([
        'before',
        'the step that broke',
        'again in r-02',
      ]);
    });

    it('reads as seen again, and opens the latest run that caught it', () => {
      const onOpenRun = vi.fn();
      const { result } = renderHook(() =>
        useBugCardViewModel({ ...PROPS, bug: AGAIN, lastRunId: 'r-02', onOpenRun }),
      );

      result.current.onRunClick();

      expect(result.current.newLabel).toBe('seen again');
      expect(result.current.runLabel).toBe('Go to run r-02');
      expect(onOpenRun).toHaveBeenCalledWith('r-02');
    });
  });

  it('toggles its own bug', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onToggle }));

    result.current.onHeadClick();

    expect(onToggle).toHaveBeenCalledWith('BUG-01');
  });

  it('hands the card the moment of the run video it was caught in, to show beside its screenshots', () => {
    const moment = { workspaceId: 'w1', runId: 'r-01', atMs: 9_500 };
    const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, moment }));

    expect(result.current.moment).toEqual(moment);
    expect(renderHook(() => useBugCardViewModel(PROPS)).result.current.moment).toBeNull();
  });

  describe('the tracker', () => {
    const FILED = {
      tracker: 'jira' as const,
      key: 'SHOP-57',
      url: 'https://acme.atlassian.net/browse/SHOP-57',
      at: '2026-10-22T12:00:00.000Z',
    };

    it('offers to send a bug that went nowhere yet', () => {
      const onSend = vi.fn();
      const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onSend }));

      expect(result.current.filedKey).toBeNull();

      result.current.onSendClick();

      expect(onSend).toHaveBeenCalledWith(BUG.id);
    });

    it('names the issue a bug became, and opens it', () => {
      const opened = vi.spyOn(window, 'open').mockReturnValue(null);
      const { result } = renderHook(() =>
        useBugCardViewModel({ ...PROPS, bug: { ...BUG, filed: FILED } }),
      );

      expect(result.current.filedKey).toBe('SHOP-57');
      expect(result.current.issueLabel).toBe('View in Jira');
      expect(result.current.canCopyScreen).toBe(false);

      result.current.onIssueClick();

      expect(opened).toHaveBeenCalledWith(FILED.url, '_blank', 'noreferrer');
      opened.mockRestore();
    });

    it('copies the screen to paste into a GitHub issue', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        copyShot: vi.fn().mockResolvedValue(true),
      };

      const { result } = renderHook(() =>
        useBugCardViewModel({
          ...PROPS,
          bug: { ...BUG, filed: { ...FILED, tracker: 'github', key: '#42' } },
        }),
      );

      expect(result.current.canCopyScreen).toBe(true);

      act(() => {
        result.current.onCopyScreen();
      });

      await waitFor(() => {
        expect(result.current.copyLabel).toBe('Copied');
      });
      Reflect.deleteProperty(window, 'qazinho');
    });
  });

  describe('the update chip', () => {
    const REVIEW = {
      runs: ['r-02'],
      state: 'suggested' as const,
      verdict: 'news' as const,
      reason: '',
      comment: 'x',
      url: null,
      error: '',
      at: '',
    };

    it('marks a bug with an update waiting on the QA, and a regression apart', () => {
      expect(
        renderHook(() =>
          useBugCardViewModel({ ...PROPS, bug: { ...BUG, review: REVIEW } }),
        ).result.current.updateChip,
      ).toEqual({ label: 'update', className: 'bug-card__update' });
      expect(
        renderHook(() =>
          useBugCardViewModel({
            ...PROPS,
            bug: { ...BUG, review: { ...REVIEW, verdict: 'regression' } },
          }),
        ).result.current.updateChip,
      ).toEqual({
        label: 'regression',
        className: 'bug-card__update bug-card__update--regression',
      });
    });

    it('marks nothing once the update is posted or put aside', () => {
      expect(
        renderHook(() =>
          useBugCardViewModel({
            ...PROPS,
            bug: { ...BUG, review: { ...REVIEW, state: 'posted' } },
          }),
        ).result.current.updateChip,
      ).toBeNull();
    });
  });

  describe('onDismissClick', () => {
    /** Um falso positivo ficava entre os bugs abertos para sempre. */
    it('lets the QA say it is no bug, and hides the way to send it', () => {
      const onDismiss = vi.fn();
      const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, onDismiss }));

      expect(result.current).toMatchObject({
        dismissLabel: 'Not a bug',
        isTrackerShown: true,
      });

      result.current.onDismissClick();

      expect(onDismiss).toHaveBeenCalledWith({ bugId: BUG.id, isDismissed: true });
    });

    it('opens a dismissed bug again', () => {
      const onDismiss = vi.fn();
      const { result } = renderHook(() =>
        useBugCardViewModel({ ...PROPS, bug: { ...BUG, isDismissed: true }, onDismiss }),
      );

      expect(result.current).toMatchObject({
        dismissLabel: 'Open it again',
        isTrackerShown: false,
      });

      result.current.onDismissClick();

      expect(onDismiss).toHaveBeenCalledWith({ bugId: BUG.id, isDismissed: false });
    });
  });

  describe('the card, open', () => {
    const LONG = {
      ...BUG,
      repro: [
        { action: 'Open the shop', isBad: false },
        { action: 'Open the cart', isBad: false },
        { action: 'Type the coupon', isBad: false },
        { action: 'Apply it', isBad: true },
        { action: 'Pay', isBad: false },
      ],
      shots: [
        { isBad: false, src: 'data:before', file: null },
        { isBad: true, src: 'data:broke', file: null },
      ],
    };

    /**
     * A run, o id do caso, o viewport e o modelo encabeçavam o cartão; o QA os lia antes
     * do bug.
     */
    it('says where it was caught in one line, the case by its title', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({ ...PROPS, bug: { ...LONG, seenRuns: 2 } }),
      );

      expect(result.current.provenance).toEqual({
        place: `${LONG.caseId} · step ${String(LONG.stepNumber)}`,
        caseTitle: LONG.caseTitle,
        run: `the ${LONG.runWhen} run`,
        seen: 'seen in 2 runs',
      });
    });

    it('offers no run that is gone', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({ ...PROPS, hasRun: false, bug: LONG }),
      );

      expect(result.current.provenance.run).toBeNull();
    });

    it('puts the screen it broke on first, the others beside it', () => {
      const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, bug: LONG }));

      expect(result.current.hero?.src).toBe('data:broke');
      expect(result.current.thumbs.map(({ src }) => src)).toEqual(['data:before']);
    });

    const stepsUpTo = (props: { total: number; broke: number }) =>
      Array.from({ length: props.total }, (_, index) => ({
        action: `Step ${String(index + 1)}`,
        isBad: index + 1 === props.broke,
      }));

    it('shows every step of a short bug from the first', () => {
      const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, bug: LONG }));

      expect(result.current.steps.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5]);
      expect(result.current.stepsToggle).toBeNull();
    });

    /** Mostrar os passos em volta da falha parecia começar pelo meio. */
    it('shows the first steps of a long bug, and the rest on asking', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({
          ...PROPS,
          bug: { ...LONG, repro: stepsUpTo({ total: 8, broke: 3 }) },
        }),
      );

      expect(result.current.steps.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5]);
      expect(result.current.stepsToggle).toBe('Show 3 more steps');

      act(() => {
        result.current.onStepsToggle();
      });

      expect(result.current.steps).toHaveLength(8);
      expect(result.current.stepsToggle).toBe('Show fewer');
    });

    it('does NOT fold away the step that broke, however far down it is', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({
          ...PROPS,
          bug: { ...LONG, repro: stepsUpTo({ total: 9, broke: 7 }) },
        }),
      );

      expect(result.current.steps.map(({ number }) => number)).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);
      expect(result.current.stepsToggle).toBe('Show 2 more steps');
    });

    it('says one more step in the singular', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({
          ...PROPS,
          bug: { ...LONG, repro: stepsUpTo({ total: 6, broke: 2 }) },
        }),
      );

      expect(result.current.stepsToggle).toBe('Show 1 more step');
    });

    it('does NOT offer more steps than a short bug has', () => {
      const { result } = renderHook(() =>
        useBugCardViewModel({
          ...PROPS,
          bug: { ...LONG, repro: [{ action: 'Apply it', isBad: true }] },
        }),
      );

      expect(result.current.stepsToggle).toBeNull();
    });

    it('keeps how it was found folded until the QA opens it', () => {
      const { result } = renderHook(() => useBugCardViewModel({ ...PROPS, bug: LONG }));

      expect(result.current.isDetailsOpen).toBe(false);

      act(() => {
        result.current.onDetailsToggle();
      });

      expect(result.current.isDetailsOpen).toBe(true);
    });
  });
});

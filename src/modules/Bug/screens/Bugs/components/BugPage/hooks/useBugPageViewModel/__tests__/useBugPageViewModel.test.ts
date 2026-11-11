// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useBugPageViewModel } from '@/modules/Bug/screens/Bugs/components/BugPage/hooks/useBugPageViewModel';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useWorkspaceStore } from '@/store';

const WORKSPACE = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
  isFinished: true,
});
const BUG = WORKSPACE.bugs[0]!;
const PROPS = {
  workspaceId: 'w1',
  bug: BUG,
  hasRun: true,
  hasCase: true,
  lastRunId: 'r-01',
  moment: null,
  onBack: vi.fn(),
  onOpenRun: vi.fn(),
  onOpenCase: vi.fn(),
  onSend: vi.fn(),
  onDismiss: vi.fn(),
};

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useBugPageViewModel', () => {
  it('says where the bug came from, so a developer can find it again', () => {
    const { result } = renderHook(() => useBugPageViewModel(PROPS));

    expect(result.current.metaKey).toBe('BUG.PAGE_META_ONE');
    expect(result.current.metaValues).toMatchObject({ step: 2, caseId: 'TC-02' });
  });

  it('writes every label and word on the card in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useBugPageViewModel(PROPS));

    expect(result.current.backLabel).toBe('Todos os bugs');
    expect(result.current.shots.map(({ label }) => label)).toEqual([
      'antes',
      'o passo que quebrou',
    ]);
    expect(result.current.runLabel).toBe('Ir para a run r-01');
    expect(result.current.caseLabel).toBe('Ir para o caso TC-02');
  });

  it('counts the runs that caught it once there is more than one', () => {
    const { result } = renderHook(() =>
      useBugPageViewModel({ ...PROPS, bug: { ...BUG, seenRuns: 3 } }),
    );

    expect(result.current.metaKey).toBe('BUG.PAGE_META_OTHER');
    expect(result.current.metaValues.count).toBe(3);
  });

  it('goes to the run the bug was caught in, named as a run', () => {
    const onOpenRun = vi.fn();
    const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, onOpenRun }));

    result.current.onRunClick();

    expect(onOpenRun).toHaveBeenCalledWith('r-01');
    expect(result.current.runLabel).toBe('Go to run r-01');
    expect(result.current.hasRun).toBe(true);
  });

  it('goes to the case the bug was caught on, named as a case', () => {
    const onOpenCase = vi.fn();
    const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, onOpenCase }));

    result.current.onCaseClick();

    expect(onOpenCase).toHaveBeenCalledWith('TC-02');
    expect(result.current.caseLabel).toBe('Go to case TC-02');
    expect(result.current.hasCase).toBe(true);
  });

  it('does NOT offer a case the plan does not have', () => {
    const { result } = renderHook(() =>
      useBugPageViewModel({ ...PROPS, hasCase: false }),
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

      const { result } = renderHook(() => useBugPageViewModel(OFF));

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

      expect(renderHook(() => useBugPageViewModel(OFF)).result.current).toMatchObject({
        offDesign: 'off the design',
        frameLabel: null,
      });
      expect(renderHook(() => useBugPageViewModel(PROPS)).result.current).toMatchObject({
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

    it('says after how many runs saw it', () => {
      const { result } = renderHook(() =>
        useBugPageViewModel({ ...PROPS, bug: AGAIN, lastRunId: 'r-02' }),
      );

      expect(result.current.metaValues).toMatchObject({ count: 2, when: '10:05' });
    });

    it('shows the screen of each time it came back, after the first ones', () => {
      const { result } = renderHook(() =>
        useBugPageViewModel({ ...PROPS, bug: AGAIN, lastRunId: 'r-02' }),
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
        useBugPageViewModel({ ...PROPS, bug: AGAIN, lastRunId: 'r-02', onOpenRun }),
      );

      result.current.onRunClick();

      expect(result.current.runLabel).toBe('Go to run r-02');
      expect(onOpenRun).toHaveBeenCalledWith('r-02');
    });
  });

  it('goes back to every bug', () => {
    const onBack = vi.fn();
    const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, onBack }));

    result.current.onBack();

    expect(onBack).toHaveBeenCalled();
  });

  it('hands the card the moment of the run video it was caught in, to show beside its screenshots', () => {
    const moment = { workspaceId: 'w1', runId: 'r-01', atMs: 9_500 };
    const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, moment }));

    expect(result.current.moment).toEqual(moment);
    expect(renderHook(() => useBugPageViewModel(PROPS)).result.current.moment).toBeNull();
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
      const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, onSend }));

      expect(result.current.filedKey).toBeNull();

      result.current.onSendClick();

      expect(onSend).toHaveBeenCalledWith(BUG.id);
    });

    it('names the issue a bug became, and opens it', () => {
      const opened = vi.spyOn(window, 'open').mockReturnValue(null);
      const { result } = renderHook(() =>
        useBugPageViewModel({ ...PROPS, bug: { ...BUG, filed: FILED } }),
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
        useBugPageViewModel({
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

  describe('onDismissClick', () => {
    /** Um falso positivo ficava entre os bugs abertos para sempre. */
    it('lets the QA say it is no bug, and hides the way to send it', () => {
      const onDismiss = vi.fn();
      const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, onDismiss }));

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
        useBugPageViewModel({ ...PROPS, bug: { ...BUG, isDismissed: true }, onDismiss }),
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
        useBugPageViewModel({ ...PROPS, bug: { ...LONG, seenRuns: 2 } }),
      );

      expect(result.current).toMatchObject({
        metaKey: 'BUG.PAGE_META_OTHER',
        metaValues: {
          count: 2,
          when: LONG.runWhen,
          step: LONG.stepNumber,
          caseId: LONG.caseId,
        },
        caseTitle: LONG.caseTitle,
      });
    });

    it('offers no run that is gone', () => {
      const { result } = renderHook(() =>
        useBugPageViewModel({ ...PROPS, hasRun: false, bug: LONG }),
      );

      expect(result.current.hasRun).toBe(false);
    });

    it('puts the screen it broke on first, the others beside it', () => {
      const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, bug: LONG }));

      expect(result.current.hero?.src).toBe('data:broke');
      expect(result.current.thumbs.map(({ src }) => src)).toEqual(['data:before']);
    });

    const stepsUpTo = (props: { total: number; broke: number }) =>
      Array.from({ length: props.total }, (_, index) => ({
        action: `Step ${String(index + 1)}`,
        isBad: index + 1 === props.broke,
      }));

    it('shows every step of a short bug from the first', () => {
      const { result } = renderHook(() => useBugPageViewModel({ ...PROPS, bug: LONG }));

      expect(result.current.steps.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5]);
      expect(result.current.stepsToggle).toBeNull();
    });

    /** Mostrar os passos em volta da falha parecia começar pelo meio. */
    it('shows the first steps of a long bug, and the rest on asking', () => {
      const { result } = renderHook(() =>
        useBugPageViewModel({
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
        useBugPageViewModel({
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
        useBugPageViewModel({
          ...PROPS,
          bug: { ...LONG, repro: stepsUpTo({ total: 6, broke: 2 }) },
        }),
      );

      expect(result.current.stepsToggle).toBe('Show 1 more step');
    });

    it('does NOT offer more steps than a short bug has', () => {
      const { result } = renderHook(() =>
        useBugPageViewModel({
          ...PROPS,
          bug: { ...LONG, repro: [{ action: 'Apply it', isBad: true }] },
        }),
      );

      expect(result.current.stepsToggle).toBeNull();
    });
  });
});

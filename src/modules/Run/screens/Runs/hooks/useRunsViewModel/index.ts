import { useTranslation } from 'react-i18next';
import { STATUS } from '@/components/atoms/StatusPill/constants';
import { MOTION } from '@/constants';
import { RUN_FILTERS, RUN_VERDICTS } from '@/modules/Run/constants';
import { caseVerdict, filterCases } from '@/modules/Run/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useRunsViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const selectedRunId = useWorkspaceStore((state) => state.selectedRunId);
  const runFilter = useWorkspaceStore((state) => state.runFilter);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const setRunFilter = useWorkspaceStore((state) => state.setRunFilter);
  const openMedia = useAppStore((state) => state.openMedia);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const runs = workspace?.runs ?? [];
  const bugs = workspace?.bugs ?? [];
  const run = runs.find(({ id }) => id === selectedRunId) ?? runs[0] ?? null;

  // A run saved before caseVerdict existed carries a case verdict its steps contradict.
  const judged = (run?.cases ?? []).map((runCase) => ({
    ...runCase,
    verdict: caseVerdict(runCase.steps),
  }));

  const onOpenBug = (bugId: string) => {
    toggleBug(bugId);
    selectTab('bugs');
  };

  const onOpenShot = (props: {
    label: string;
    src: string | null;
    file: string | null;
  }) => {
    openMedia({
      kicker: run?.id ?? '',
      title: props.label,
      isTall: workspace?.planKind === 'mobile',
      src: props.src,
      file: props.file,
    });
  };

  return {
    runs: runs.map((item) => ({
      ...item,
      isSelected: item.id === run?.id,
    })),
    run,
    counts: RUN_VERDICTS.map((status, index) => ({
      status,
      glyph: STATUS[status].glyph,
      count: run?.counts[status] ?? 0,
      label: t(STATUS[status].labelKey),
      delay: index * MOTION.stagger,
    })),
    filters: RUN_FILTERS.map((item) => ({
      id: item,
      label: t(`RUN.${item.toUpperCase()}` as 'RUN.ALL'),
      isActive: item === runFilter,
    })),
    filter: runFilter,
    cases: filterCases({ cases: judged, filter: runFilter }).map((runCase) => ({
      ...runCase,
      duration: t('RUN.DURATION', { seconds: runCase.durationSec }),
      steps: runCase.steps.map((step) => {
        const bug = bugs.find(({ id }) => id === step.bugId) ?? null;

        return {
          ...step,
          glyph: STATUS[step.verdict].glyph,
          verdictLabel: t(STATUS[step.verdict].labelKey),
          isMuted: step.verdict === 'skipped' || step.verdict === 'blocked',
          bug:
            bug === null
              ? null
              : { id: bug.id, title: bug.title, isHigh: bug.severity === 'high' },
          hasNote: step.why !== null && bug === null,
          shotLabel: t('RUN.STEP_SHOT', { id: runCase.id, number: step.number }),
        };
      }),
    })),
    isEmpty: runs.length === 0,
    onSelectRun: selectRun,
    onFilter: setRunFilter,
    onOpenBug,
    onOpenShot,
  };
};

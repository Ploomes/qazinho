import type { IRun, ReplayFocus, RunEnd } from '@/modules/Run/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatElapsed } from '@/modules/Device/library';
import {
  RUN_ENDS,
  RUN_FILTERS,
  RUN_PAGE_SIZE,
  RUN_VERDICTS,
} from '@/modules/Run/constants';
import {
  answerLineOf,
  caseVerdict,
  caseWalkOf,
  filterCases,
  formatCost,
  pageOf,
  withExplorationTitle,
} from '@/modules/Run/library';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { MOTION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useRunsViewModel = () => {
  const { t, i18n } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    runs: opened.runs,
    bugs: opened.bugs,
  }));
  const selectedRunId = useWorkspaceStore((state) => state.selectedRunId);
  const runFilter = useWorkspaceStore((state) => state.runFilter);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const setRunFilter = useWorkspaceStore((state) => state.setRunFilter);
  const openMedia = useAppStore((state) => state.openMedia);
  const openReplay = useAppStore((state) => state.openReplay);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const [page, setPage] = useState(0);
  const [isAtTop, setAtTop] = useState(true);
  const topRef = useRef<HTMLDivElement>(null);

  const runs = workspace?.runs ?? [];
  const bugs = workspace?.bugs ?? [];
  const picked = runs.find(({ id }) => id === selectedRunId) ?? runs[0] ?? null;
  const run =
    picked === null
      ? null
      : withExplorationTitle({ run: picked, title: t('RUN.EXPLORATION') });

  const paged = pageOf({ items: runs, page, size: RUN_PAGE_SIZE });

  const judged = (run?.cases ?? []).map((runCase) => ({
    ...runCase,
    verdict: caseVerdict(runCase.steps),
  }));

  const endOf = (endedBy: RunEnd) => {
    const end = RUN_ENDS[endedBy];

    return end === null ? null : { icon: end.icon, label: t(end.labelKey) };
  };

  const factsOf = (item: IRun) =>
    item.costUsd === null
      ? formatElapsed(item.durationSec)
      : t('RUN.FACTS', {
          duration: formatElapsed(item.durationSec),
          cost: formatCost({ costUsd: item.costUsd, language: i18n.language }),
        });

  const hasRun = run !== null;
  const canWatch = run?.video !== null && run?.video !== undefined;

  const watch = (focus: ReplayFocus) => {
    if (workspace === null || run === null) return;

    openReplay({ workspaceId: workspace.id, runId: run.id, focus });
  };

  useEffect(() => {
    const top = topRef.current;

    if (top === null || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => {
      setAtTop(entry?.isIntersecting ?? true);
    });

    observer.observe(top);

    return () => {
      observer.disconnect();
    };
  }, [hasRun]);

  const summaryOf = (item: IRun) => ({
    id: item.id,
    what: item.kind === 'explore' ? t('RUN.EXPLORATION') : t('RUN.WHOLE_PLAN'),
    isSelected: item.id === run?.id,
    ended: endOf(item.endedBy),
    counts: item.counts,
    facts: factsOf(item),
    startedAt: item.startedAt,
  });

  const toTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      src: props.src,
      file: props.file,
    });
  };

  return {
    runs: paged.items.map(summaryOf),
    runTotal: runs.length,
    current: run === null ? null : summaryOf(run),
    run,
    title:
      run === null
        ? ''
        : t(run.kind === 'explore' ? 'RUN.EXPLORATION_TITLE' : 'RUN.TITLE', {
            id: run.id,
          }),
    canWatch,
    watchLabel: t('RUN.WATCH'),
    onWatch: () => {
      watch({ kind: 'run' });
    },
    runEnded: run === null ? null : endOf(run.endedBy),
    runFacts: run === null ? '' : factsOf(run),
    factsNote: t('RUN.COST_NOTE'),
    topRef,
    showsToTop: !isAtTop,
    onToTop: toTop,
    pager: {
      isShown: paged.pageCount > 1,
      label: t('RUN.PAGE', { from: paged.from, to: paged.to, total: runs.length }),
      canGoBack: paged.page > 0,
      canGoOn: paged.page < paged.pageCount - 1,
    },
    counts: RUN_VERDICTS.map((status, index) => ({
      status,
      icon: STATUS[status].icon,
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
      walk: (() => {
        const walk = caseWalkOf(runCase.steps);

        return walk === null
          ? null
          : {
              label: t(walk === 'replay' ? 'RUN.BY_REPLAY' : 'RUN.BY_HEALED'),
              title: t(walk === 'replay' ? 'RUN.BY_REPLAY_TIP' : 'RUN.BY_HEALED_TIP'),
              className: `runs__walk runs__walk--${walk}`,
            };
      })(),
      take:
        canWatch && runCase.steps.some(({ span }) => span !== null)
          ? {
              label: t('RUN.TAKE'),
              title: t('RUN.WATCH_CASE', { id: runCase.id }),
              onClick: () => {
                watch({ kind: 'case', caseId: runCase.id });
              },
            }
          : null,
      steps: runCase.steps.map((step) => {
        const bug = bugs.find(({ id }) => id === step.bugId) ?? null;

        return {
          ...step,
          icon: STATUS[step.verdict].icon,
          verdictLabel: t(STATUS[step.verdict].labelKey),
          isMuted: step.verdict === 'skipped' || step.verdict === 'blocked',
          bug:
            bug === null
              ? null
              : { id: bug.id, title: bug.title, isHigh: bug.severity === 'high' },
          note:
            step.by === 'replay' && step.proof !== undefined
              ? t('RUN.PROOF', { proof: step.proof })
              : step.why,
          hasNote: (step.why !== null || step.by === 'replay') && bug === null,
          asked: (run?.asked ?? [])
            .filter(
              ({ caseId, stepNumber }) =>
                caseId === runCase.id && stepNumber === step.number,
            )
            .map((asked) => {
              const line = answerLineOf(asked.answer);

              return {
                key: asked.id,
                question: asked.question,
                isAnswered:
                  asked.answer.kind === 'said' || asked.answer.kind === 'secret',
                isSecret: asked.answer.kind === 'secret',
                answer:
                  line.kind === 'words'
                    ? line.text
                    : t(line.key as never, { name: line.name }),
              };
            }),
          shotLabel: t('RUN.STEP_SHOT', { id: runCase.id, number: step.number }),
        };
      }),
    })),
    isEmpty: runs.length === 0,
    onSelectRun: (runId: string) => {
      selectRun(runId);
      setRunFilter('all');
      toTop();
    },
    onPreviousPage: () => {
      setPage(paged.page - 1);
    },
    onNextPage: () => {
      setPage(paged.page + 1);
    },
    onFilter: setRunFilter,
    onOpenBug,
    onOpenShot,
  };
};

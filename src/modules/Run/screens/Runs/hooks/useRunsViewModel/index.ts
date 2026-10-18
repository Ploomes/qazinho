import type { IRun, RunEnd } from '@/modules/Run/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatElapsed } from '@/modules/Device/library';
import {
  RUN_ENDS,
  RUN_FILTERS,
  RUN_PAGE_SIZE,
  RUN_VERDICTS,
} from '@/modules/Run/constants';
import { caseVerdict, filterCases, formatCost, pageOf } from '@/modules/Run/library';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { MOTION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useRunsViewModel = () => {
  const { t, i18n } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    runs: opened.runs,
    bugs: opened.bugs,
  }));
  const selectedRunId = useWorkspaceStore((state) => state.selectedRunId);
  const runFilter = useWorkspaceStore((state) => state.runFilter);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const setRunFilter = useWorkspaceStore((state) => state.setRunFilter);
  const openMedia = useAppStore((state) => state.openMedia);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const [page, setPage] = useState(0);
  const [isAtTop, setAtTop] = useState(true);
  const topRef = useRef<HTMLDivElement>(null);

  const runs = workspace?.runs ?? [];
  const bugs = workspace?.bugs ?? [];
  const run = runs.find(({ id }) => id === selectedRunId) ?? runs[0] ?? null;

  const paged = pageOf({ items: runs, page, size: RUN_PAGE_SIZE });

  const judged = (run?.cases ?? []).map((runCase) => ({
    ...runCase,
    verdict: caseVerdict(runCase.steps),
  }));

  const endOf = (endedBy: RunEnd) => {
    const end = RUN_ENDS[endedBy];

    return end === null ? null : { glyph: end.glyph, label: t(end.labelKey) };
  };

  const factsOf = (item: IRun) =>
    item.costUsd === null
      ? formatElapsed(item.durationSec)
      : t('RUN.FACTS', {
          duration: formatElapsed(item.durationSec),
          cost: formatCost({ costUsd: item.costUsd, language: i18n.language }),
        });

  const hasRun = run !== null;

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
    what: t('RUN.WHOLE_PLAN'),
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
    current: run === null ? null : summaryOf(run),
    run,
    title: run === null ? '' : t('RUN.TITLE', { id: run.id }),
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

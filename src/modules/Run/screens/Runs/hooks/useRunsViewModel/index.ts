import type { IRun, ReplayFocus, RunEnd } from '@/modules/Run/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatElapsed } from '@/modules/Device/library';
import { liveCasesOf } from '@/modules/Plan/library';
import {
  RUN_ENDS,
  RUN_PAGE_SIZE,
  RUN_TALLY_KEYS,
  RUN_VERDICTS,
  RUN_WALK_LOOKS,
  UNWALKED_KEYS,
} from '@/modules/Run/constants';
import {
  answerLineOf,
  caseVerdict,
  caseWalkOf,
  countVerdicts,
  dayLabelOf,
  exceptionFirst,
  formatCost,
  pageOf,
  runDayOf,
  walkedStepsOf,
  withExplorationTitle,
} from '@/modules/Run/library';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useToTop } from '@/shared/hooks/useToTop';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useRunsViewModel = () => {
  const { t, i18n } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    planSize: opened.plan.length,
    runs: opened.runs,
    bugs: opened.bugs,
    plan: opened.plan,
    live: opened.live,
  }));
  const selectedRunId = useWorkspaceStore((state) => state.selectedRunId);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const openMedia = useAppStore((state) => state.openMedia);
  const openReplay = useAppStore((state) => state.openReplay);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const [page, setPage] = useState(0);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const { topRef, isToTopShown, onToTop } = useToTop();

  const runs = workspace?.runs ?? [];
  const plan = workspace?.plan ?? [];
  const going = workspace?.live ?? null;
  const liveCases = liveCasesOf({ plan, live: going });
  const liveIds = Object.keys(liveCases);
  const live =
    going === null || liveIds.length === 0
      ? null
      : {
          title: t('RUN.LIVE_TITLE'),
          facts: t('RUN.LIVE_FACTS', {
            done: going.outcomes.length,
            total: walkedStepsOf({ plan, caseIds: going.caseIds }).length,
            time: formatElapsed(going.elapsedSec),
          }),
          watchLabel: t('RUN.LIVE_WATCH'),
          onWatch: () => {
            selectTab('device');
          },
          cases: plan
            .filter(({ id }) => liveIds.includes(id))
            .map((testCase) => {
              const item = liveCases[testCase.id];
              const status = item?.status ?? 'pending';
              const isNow =
                status === 'running' || status === 'paused' || status === 'attention';

              return {
                key: testCase.id,
                id: testCase.id,
                title: testCase.title,
                status,
                isNow,
                isWaiting: status === 'pending',
                note: isNow
                  ? t('RUN.LIVE_NOW')
                  : status === 'pending'
                    ? t('RUN.LIVE_QUEUED')
                    : '',
                steps: isNow
                  ? (item?.run?.steps ?? []).map((step) => ({
                      key: `${testCase.id}-${String(step.number)}`,
                      number: step.number,
                      action: step.action,
                      status: step.verdict,
                      isNow: step.verdict === 'running',
                      shot: step.shot,
                      onOpen: () => {
                        openMedia({
                          kicker: going.id,
                          title: t('RUN.STEP_SHOT', {
                            id: testCase.id,
                            number: step.number,
                          }),
                          src: step.shot,
                          file: step.shotFile,
                        });
                      },
                    }))
                  : [],
              };
            }),
        };
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
  const isExploration = run?.kind === 'explore';
  const ordered = exceptionFirst(judged);
  const caseCounts = countVerdicts(judged.map(({ verdict }) => verdict));
  const screenCount = judged.reduce((total, { steps }) => total + steps.length, 0);
  const bugCount = new Set(
    judged.flatMap(({ steps }) =>
      steps.flatMap(({ bugId }) => (bugId === null ? [] : [bugId])),
    ),
  ).size;

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

  const tallyOf = (item: IRun) => {
    const counts = countVerdicts(item.cases.map(({ steps }) => caseVerdict(steps)));

    return item.kind === 'explore'
      ? []
      : RUN_VERDICTS.filter((status) => counts[status] > 0).map((status) => ({
          status,
          icon: STATUS[status].icon,
          count: counts[status],
        }));
  };

  const canWatch = run?.video !== null && run?.video !== undefined;

  const watch = (focus: ReplayFocus) => {
    if (workspace === null || run === null) return;

    openReplay({ workspaceId: workspace.id, runId: run.id, focus });
  };

  const summaryOf = (item: IRun) => ({
    id: item.id,
    what:
      item.kind === 'explore'
        ? t('RUN.EXPLORATION')
        : item.cases.length < (workspace?.planSize ?? 0)
          ? t('RUN.SOME_CASES', { count: item.cases.length })
          : t('RUN.WHOLE_PLAN'),
    isSelected: item.id === run?.id,
    ended: endOf(item.endedBy),
    tallies: tallyOf(item),
    facts: factsOf(item),
    startedAt: [
      dayLabelOf({
        day: runDayOf(item),
        now: new Date(),
        language: i18n.language,
        words: { today: t('COMMON.TODAY'), yesterday: t('COMMON.YESTERDAY') },
      }),
      item.startedAt,
    ]
      .filter((part) => part !== '')
      .join(', '),
  });

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
    runDuration: run === null ? '' : formatElapsed(run.durationSec),
    factsNote: t('RUN.COST_NOTE'),
    topRef,
    isToTopShown,
    onToTop,
    pager: {
      isShown: paged.pageCount > 1,
      label: t('RUN.PAGE', { from: paged.from, to: paged.to, total: runs.length }),
      canGoBack: paged.page > 0,
      canGoOn: paged.page < paged.pageCount - 1,
    },
    summary: {
      lead: isExploration
        ? t(screenCount === 1 ? 'RUN.SCREENS_ONE' : 'RUN.SCREENS_OTHER', {
            count: screenCount,
          })
        : null,
      tallies: isExploration
        ? []
        : RUN_VERDICTS.filter((status) => caseCounts[status] > 0).map((status) => ({
            status,
            icon: STATUS[status].icon,
            count: caseCounts[status],
            label: t(
              caseCounts[status] === 1
                ? RUN_TALLY_KEYS[status].one
                : RUN_TALLY_KEYS[status].other,
              { count: caseCounts[status] },
            ),
          })),
      bugs:
        bugCount === 0
          ? null
          : {
              count: bugCount,
              label: t(bugCount === 1 ? 'RUN.BUGS_ONE' : 'RUN.BUGS_OTHER', {
                count: bugCount,
              }),
            },
    },
    cases: ordered.map((runCase) => ({
      ...runCase,
      isOpen:
        toggled[`${run?.id ?? ''}/${runCase.id}`] ??
        (isExploration || runCase.verdict !== 'passed'),
      onToggle: () => {
        const key = `${run?.id ?? ''}/${runCase.id}`;

        setToggled({
          ...toggled,
          [key]: !(toggled[key] ?? (isExploration || runCase.verdict !== 'passed')),
        });
      },
      duration: t('RUN.DURATION', { seconds: runCase.durationSec }),
      walk: (() => {
        const walk = caseWalkOf(runCase.steps);

        return walk === null
          ? null
          : {
              icon: RUN_WALK_LOOKS[walk].icon,
              title: t(RUN_WALK_LOOKS[walk].tipKey),
              className: `runs__walk runs__walk--${walk}`,
            };
      })(),
      bug: (() => {
        const count = new Set(
          runCase.steps.flatMap(({ bugId }) => (bugId === null ? [] : [bugId])),
        ).size;

        return count === 0
          ? null
          : { title: t(count === 1 ? 'RUN.BUGS_ONE' : 'RUN.BUGS_OTHER', { count }) };
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
        const isOneLine = !isExploration && step.verdict === 'passed';
        const note =
          step.by === 'replay' && step.proof !== undefined
            ? t('RUN.PROOF', { proof: step.proof })
            : step.unwalked === undefined
              ? step.why
              : t(UNWALKED_KEYS[step.unwalked]);

        return {
          ...step,
          mark: step.verdict === 'passed' ? null : STATUS[step.verdict].icon,
          verdictLabel: t(STATUS[step.verdict].labelKey),
          isMuted: step.verdict === 'skipped' || step.verdict === 'blocked',
          bug:
            bug === null
              ? null
              : { id: bug.id, title: bug.title, isHigh: bug.severity === 'high' },
          note,
          noteTip: isOneLine ? (note ?? undefined) : undefined,
          hasNote:
            !isOneLine && (step.why !== null || step.by === 'replay') && bug === null,
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
    live,
    isEmpty: runs.length === 0,
    onSelectRun: (runId: string) => {
      selectRun(runId);
      onToTop();
    },
    onPreviousPage: () => {
      setPage(paged.page - 1);
    },
    onNextPage: () => {
      setPage(paged.page + 1);
    },
    onOpenBug,
    onOpenShot,
  };
};

import type {
  ISuitePlanCase,
  SuiteChangeAsk,
  SuiteResultState,
  SuiteScope,
} from '@/modules/Automation/types';
import type { ChangeEvent, CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EMPTY_CHANGE_NOTES,
  EMPTY_SUITE_CHANGES,
  EMPTY_SUITE_RUNS,
  SUITE_FAILURE_KEYS,
  SUITE_RESULT_STATES,
} from '@/modules/Automation/constants';
import {
  batchesOf,
  changeOfTest,
  folderOf,
  formatSuiteWhen,
  lastResultsOf,
  nextChangeId,
  nextSuiteRunId,
  planCaseOf,
  requestsOf,
  resultStateOf,
  scopeTestsOf,
  suiteTreeOf,
} from '@/modules/Automation/library';
import { AUTOMATION_LAYOUT } from '@/modules/Automation/screens/Automation/constants';
import { Suites } from '@/services';
import { MOTION } from '@/shared/constants';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useSuiteStore,
  useWorkspaceStore,
} from '@/store';

export const useAutomationViewModel = () => {
  const { t, i18n } = useTranslation();
  const projectId = useAppStore((state) => state.automationProjectId) ?? '';
  const hasProject = useAppStore((state) =>
    state.projects.some(({ id }) => id === projectId),
  );
  const openImportSettings = useAppStore((state) => state.openImportSettings);
  const suite = useSuiteStore((state) => state.suites[projectId] ?? null);
  const list = useSuiteStore((state) => state.lists[projectId] ?? null);
  const runs = useSuiteStore((state) => state.runs[projectId] ?? EMPTY_SUITE_RUNS);
  const live = useSuiteStore((state) => state.live[projectId] ?? null);
  const pickedId = useSuiteStore((state) => state.picked[projectId] ?? null);
  const changes = useSuiteStore(
    (state) => state.changes[projectId] ?? EMPTY_SUITE_CHANGES,
  );
  const changeNotes = useSuiteStore((state) => state.changeNotes);
  const pickedChangeId = useSuiteStore((state) => state.pickedChanges[projectId] ?? null);
  const pickChange = useSuiteStore((state) => state.pickChange);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const agent = useSettingsStore((state) => state.agent);
  const agentId = useMachineStore(
    (state) =>
      state.agents.find(({ name, isFound }) => name === agent && isFound)?.id ?? null,
  );
  const isGithubConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'github'),
  );
  const putSuite = useSuiteStore((state) => state.putSuite);
  const putList = useSuiteStore((state) => state.putList);
  const pickTest = useSuiteStore((state) => state.pickTest);
  const [query, setQuery] = useState('');
  const [shut, setShut] = useState<string[]>([]);
  const [isRefused, setRefused] = useState(false);
  const [isReloading, setReloading] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [isWriting, setWriting] = useState(false);

  useEffect(() => {
    if (projectId === '' || suite === null || list !== null) return;

    putList({ projectId, list: { kind: 'loading' } });
    void Suites.list(projectId).then((listed) => {
      putList({ projectId, list: listed });
    });
  }, [projectId, suite, list, putList]);

  const tests = list?.kind === 'listed' ? list.tests : [];
  const projects = list?.kind === 'listed' ? list.projects : [];
  const isQuerying = query.trim() !== '';
  const folders = suiteTreeOf({ tests, query });
  const shown = folders.flatMap(({ files }) => files.flatMap((file) => file.tests));
  const last = lastResultsOf(runs);
  const going = live?.going ?? {};
  const isRunning = live !== null;
  const version = suite?.version ?? null;
  const canRun = version !== null && list?.kind === 'listed' && !isRunning;
  const failedIds = tests
    .filter(({ id }) => {
      const status = last[id]?.result.status;

      return status === 'failed' || status === 'timedOut';
    })
    .map(({ id }) => id);
  const running =
    live === null ? null : (runs.find(({ id }) => id === live.runId) ?? null);
  const latest = isRunning ? null : (runs[0] ?? null);
  const picked = tests.find(({ id }) => id === pickedId) ?? null;
  const change = picked === null ? null : changeOfTest({ changes, testId: picked.id });
  const lastOfPicked = picked === null ? undefined : last[picked.id];
  const isBroken =
    lastOfPicked?.result.status === 'failed' ||
    lastOfPicked?.result.status === 'timedOut';
  const isChanging = changes.some(({ status }) => status === 'working');
  const hasGit = suite !== null && suite.branch !== null;
  const reviewing =
    changes.find(
      ({ id, status, files }) =>
        id === reviewingId &&
        (status === 'ready' || (status === 'app-bug' && files.length > 0)),
    ) ?? null;
  const requests = requestsOf(changes);
  const request = requests.find(({ id }) => id === pickedChangeId) ?? null;
  const canChange = hasGit && agentId !== null && !isChanging;
  const changeNote = !hasGit
    ? t('AUTOMATION.WRITE_NO_GIT')
    : agentId === null
      ? t('AUTOMATION.FIX_NO_AGENT')
      : isChanging
        ? t('AUTOMATION.FIX_BUSY')
        : '';
  const ask = (asked: SuiteChangeAsk): string | null => {
    if (agentId === null || !canChange) return null;

    const { model, language } = useSettingsStore.getState();
    const changeId = nextChangeId(changes);

    void Suites.change({
      projectId,
      changeId,
      agentId,
      model,
      language,
      projects,
      ask: asked,
    });

    return changeId;
  };
  const fix = () => {
    if (picked !== null && lastOfPicked !== undefined)
      ask({ kind: 'fix', test: picked, runId: lastOfPicked.runId });
  };
  const start = (scope: SuiteScope) => {
    const batches = batchesOf({ tests, projects, scope });

    if (!canRun || batches.length === 0) return;

    Suites.run({
      projectId,
      runId: nextSuiteRunId(runs),
      batches,
      expected: scopeTestsOf({ tests, scope }).length,
    });
  };
  const runTest = (testId: string) => {
    start({ kind: 'tests', testIds: [testId] });
  };
  const tallyOf = (state: SuiteResultState) => {
    const look = SUITE_RESULT_STATES[state];

    return {
      key: state,
      icon: look.icon,
      label: t(look.labelKey),
      className: `automation__tally automation__tally--${look.tone}`,
      count:
        latest?.results.filter((result) => resultStateOf(result) === state).length ?? 0,
    };
  };
  const done = running?.results.length ?? 0;
  const total = Math.max(running?.total ?? 0, done);
  const failedNow =
    running?.results.filter(({ status }) => status === 'failed' || status === 'timedOut')
      .length ?? 0;

  return {
    hasProject,
    hasSuite: suite !== null,
    style: {
      '--suite-pane-width': `${String(AUTOMATION_LAYOUT.paneWidth)}px`,
      '--suite-said-height': `${String(AUTOMATION_LAYOUT.saidHeight)}px`,
    } as CSSProperties,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
    markIconSize: AUTOMATION_LAYOUT.markIcon,
    connect: {
      title: t('AUTOMATION.TITLE'),
      text: t('AUTOMATION.CONNECT_TEXT'),
      label: t('AUTOMATION.CONNECT'),
      refused: isRefused ? t('AUTOMATION.NO_PLAYWRIGHT') : null,
    },
    onConnect: () => {
      void Suites.pick(projectId).then((pick) => {
        if (pick.kind === 'picked') putSuite({ projectId, suite: pick.suite });

        if (pick.kind !== 'cancelled') setRefused(pick.kind === 'failed');
      });
    },
    name: suite?.name ?? '',
    runner:
      version === null
        ? t('AUTOMATION.NO_PACKAGES')
        : t('AUTOMATION.PLAYWRIGHT', { version }),
    runnerClassName:
      version === null ? 'automation__fact automation__fact--attn' : 'automation__fact',
    branch: suite?.branch ?? null,
    repository: suite?.repository ?? null,
    count:
      list?.kind !== 'listed'
        ? ''
        : tests.length === 1
          ? t('AUTOMATION.TESTS_ONE')
          : t('AUTOMATION.TESTS_OTHER', { count: tests.length }),
    reloadLabel: t('AUTOMATION.RELOAD'),
    onReload: () => {
      if (isReloading) return;

      setReloading(true);
      void Promise.all([Suites.of(projectId), Suites.list(projectId)]).then(
        ([read, listed]) => {
          putSuite({ projectId, suite: read });
          putList({ projectId, list: listed });
          setReloading(false);
        },
      );
    },
    settingsLabel: t('AUTOMATION.SUITE_SETTINGS'),
    onSettings: () => {
      openImportSettings(projectId);
    },
    isRunning,
    stopLabel: t('COMMON.STOP'),
    onStop: () => {
      Suites.stop(projectId);
    },
    canRun,
    canRunAll: canRun && shown.length > 0,
    runAllLabel: !isQuerying
      ? t('AUTOMATION.RUN_ALL')
      : shown.length === 1
        ? t('AUTOMATION.RUN_SHOWN_ONE')
        : t('AUTOMATION.RUN_SHOWN_OTHER', { count: shown.length }),
    onRunAll: () => {
      start(
        isQuerying
          ? { kind: 'tests', testIds: shown.map(({ id }) => id) }
          : { kind: 'all' },
      );
    },
    hasFailed: failedIds.length > 0,
    failedCount: failedIds.length,
    runFailedLabel: t('AUTOMATION.RUN_FAILED'),
    onRunFailed: () => {
      start({ kind: 'tests', testIds: failedIds });
    },
    progress:
      running === null
        ? null
        : {
            label: t('AUTOMATION.PROGRESS', { done, total }),
            failed:
              failedNow === 0
                ? ''
                : failedNow === 1
                  ? t('AUTOMATION.PROGRESS_FAILED_ONE')
                  : t('AUTOMATION.PROGRESS_FAILED_OTHER', { count: failedNow }),
            style: {
              '--suite-done': String(total === 0 ? 0 : done / total),
            } as CSSProperties,
          },
    searchLabel: t('AUTOMATION.SEARCH'),
    query,
    onSearch: (event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    lastRun:
      latest === null
        ? null
        : {
            label: t('AUTOMATION.LAST_RUN'),
            facts: `${latest.id} · ${formatSuiteWhen({
              at: latest.endedAt ?? latest.startedAt,
              language: i18n.language,
            })}`,
            tallies: (
              ['passed', 'flaky', 'failed', 'timedOut', 'interrupted', 'skipped'] as const
            )
              .map(tallyOf)
              .filter(({ count }) => count > 0),
          },
    notice:
      latest?.status === 'broke'
        ? { text: t('AUTOMATION.RUN_BROKE'), said: latest.said }
        : latest?.status === 'stopped'
          ? { text: t('AUTOMATION.RUN_STOPPED'), said: '' }
          : null,
    listView:
      list === null || list.kind === 'loading'
        ? ('loading' as const)
        : list.kind === 'failed'
          ? ('failed' as const)
          : tests.length === 0
            ? ('empty' as const)
            : shown.length === 0
              ? ('nothing' as const)
              : ('tree' as const),
    isListing: isReloading || list === null || list.kind === 'loading',
    listingText: t('AUTOMATION.LISTING'),
    failure:
      list?.kind === 'failed'
        ? { text: t(SUITE_FAILURE_KEYS[list.reason]), said: list.said }
        : null,
    noTestsText: t('AUTOMATION.NO_TESTS'),
    nothingFoundText: t('AUTOMATION.NOTHING_FOUND', { query: query.trim() }),
    tree: {
      folders,
      last,
      going,
      pickedId,
      shut,
      isQuerying,
      canRun,
      onToggle: (path: string) => {
        setShut((before) =>
          before.includes(path)
            ? before.filter((one) => one !== path)
            : [...before, path],
        );
      },
      onPick: (testId: string) => {
        pickTest({ projectId, testId });
      },
      onRunPath: (path: string) => {
        start(
          isQuerying
            ? {
                kind: 'tests',
                testIds: shown
                  .filter(({ file }) => file === path || folderOf(file) === path)
                  .map(({ id }) => id),
              }
            : { kind: 'path', path },
        );
      },
      onRunTest: runTest,
    },
    pick: { title: t('AUTOMATION.PICK'), text: t('AUTOMATION.PICK_TEXT') },
    pane:
      picked === null || request !== null
        ? null
        : {
            key: picked.id,
            projectId,
            test: picked,
            runs,
            step: going[picked.id] ?? null,
            isRunning: picked.id in going,
            canRun,
            hasProjects: projects.length > 0,
            fix:
              change !== null || !isBroken
                ? null
                : {
                    canFix: hasGit && agentId !== null && !isChanging,
                    note: !hasGit
                      ? t('AUTOMATION.FIX_NO_GIT')
                      : agentId === null
                        ? t('AUTOMATION.FIX_NO_AGENT')
                        : isChanging
                          ? t('AUTOMATION.FIX_BUSY')
                          : t('AUTOMATION.FIX_HINT'),
                  },
            change,
            notes:
              change === null
                ? EMPTY_CHANGE_NOTES
                : (changeNotes[change.id] ?? EMPTY_CHANGE_NOTES),
            agent,
            onRun: runTest,
            onFix: fix,
            onStopFix: () => {
              if (change !== null) Suites.stopChange(change.id);
            },
            onReview: () => {
              if (change !== null) setReviewingId(change.id);
            },
            onDiscard: () => {
              if (change !== null)
                void Suites.discard({ projectId, changeId: change.id });
            },
          },
    newTestLabel: t('AUTOMATION.NEW_TEST'),
    canAskNewTest: version !== null && list?.kind === 'listed',
    onNewTest: () => {
      setWriting(true);
    },
    writing: !isWriting
      ? null
      : {
          folders: suiteTreeOf({ tests, query: '' }),
          cases: workspaces
            .filter((workspace) => workspace.projectId === projectId)
            .flatMap((workspace) =>
              workspace.plan.map((testCase) =>
                planCaseOf({ workspace: workspace.name, testCase }),
              ),
            ),
          canWrite: canChange,
          note: changeNote,
          onWrite: (asked: {
            text: string;
            folder: string;
            source: ISuitePlanCase | null;
          }) => {
            const changeId = ask({ kind: 'write', ...asked });

            if (changeId !== null) pickChange({ projectId, changeId });

            setWriting(false);
          },
          onClose: () => {
            setWriting(false);
          },
        },
    requests: {
      requests,
      pickedId: request?.id ?? null,
      onPick: (changeId: string) => {
        pickChange({ projectId, changeId });
      },
    },
    requestPane:
      request === null
        ? null
        : {
            change: request,
            notes: changeNotes[request.id] ?? EMPTY_CHANGE_NOTES,
            agent,
            onStop: () => {
              Suites.stopChange(request.id);
            },
            onReview: () => {
              setReviewingId(request.id);
            },
            onDiscard: () => {
              void Suites.discard({ projectId, changeId: request.id });
            },
            onRetry: () => {
              const changeId = ask(request.ask);

              if (changeId !== null) pickChange({ projectId, changeId });
            },
          },
    review:
      reviewing === null
        ? null
        : {
            change: reviewing,
            canOpenPullRequest:
              isGithubConnected && suite?.repository != null && reviewing.base !== '',
          },
    onCloseReview: () => {
      setReviewingId(null);
    },
  };
};

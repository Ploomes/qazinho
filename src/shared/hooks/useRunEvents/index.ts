import type { IRunEvent, IRunQuestion, IRunRef } from '@/shared/types';
import { useEffect, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useBugReviews } from '@/modules/Bug/hooks/useBugReviews';
import { isSeenIn } from '@/modules/Bug/library';
import { RUN_FAILURE_KEYS } from '@/modules/Run/constants';
import { useOpenRun } from '@/modules/Run/hooks/useOpenRun';
import { caseVerdict, countVerdicts, walkedByOf } from '@/modules/Run/library';
import { Run, Variables } from '@/services';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useRunEvents = () => {
  const { t } = useTranslation();
  const markDoing = useWorkspaceStore((state) => state.markDoing);
  const markStreaming = useWorkspaceStore((state) => state.markStreaming);
  const landNote = useWorkspaceStore((state) => state.landNote);
  const landCost = useWorkspaceStore((state) => state.landCost);
  const landFinding = useWorkspaceStore((state) => state.landFinding);
  const landAsked = useWorkspaceStore((state) => state.landAsked);
  const landAnswered = useWorkspaceStore((state) => state.landAnswered);
  const landExplored = useWorkspaceStore((state) => state.landExplored);
  const loadVariables = useVariablesStore((state) => state.load);
  const agent = useSettingsStore((state) => state.agent);
  const landStep = useWorkspaceStore((state) => state.landStep);
  const landRunDone = useWorkspaceStore((state) => state.landRunDone);
  const landVideo = useWorkspaceStore((state) => state.landVideo);
  const landRunFailed = useWorkspaceStore((state) => state.landRunFailed);
  const resumeRun = useWorkspaceStore((state) => state.resumeRun);
  const isLoaded = useWorkspaceStore((state) => state.isLoaded);
  const trackers = useSetupStore((state) => state.integrations.length);
  const showRunNotice = useAppStore((state) => state.showRunNotice);
  const openRun = useOpenRun();
  const { reviewWorkspace, reviewAll } = useBugReviews();

  const endingOf = (workspaceId: string) => {
    const live = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === workspaceId)?.live;

    return live && !live.isDone ? live.id : null;
  };

  const announce = (props: { workspaceId: string; runId: string | null }) => {
    const workspace = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === props.workspaceId);
    const run = workspace?.runs.find(({ id }) => id === props.runId);

    if (!workspace || !run) return;

    showRunNotice({
      key: `${workspace.id}/${run.id}/${String(Date.now())}`,
      workspaceId: workspace.id,
      runId: run.id,
    });

    if (useSettingsStore.getState().runAlert !== 'system') return;

    const bugs = workspace.bugs.filter((bug) => isSeenIn({ bug, runId: run.id })).length;
    const isExploration = run.kind === 'explore';
    const cases = countVerdicts(run.cases.map(({ steps }) => caseVerdict(steps)));
    const tally = [
      ...(isExploration
        ? [
            t(
              run.counts.passed === 1
                ? 'CHAT.EXPLORE_SCREENS_ONE'
                : 'CHAT.EXPLORE_SCREENS_OTHER',
              { count: run.counts.passed },
            ),
          ]
        : [
            ...(cases.failed === 0
              ? []
              : [
                  t(
                    cases.failed === 1 ? 'CHAT.RUN_FAILED_ONE' : 'CHAT.RUN_FAILED_OTHER',
                    {
                      count: cases.failed,
                    },
                  ),
                ]),
            ...(cases.passed === 0
              ? []
              : [
                  t(
                    cases.passed === 1 ? 'CHAT.RUN_PASSED_ONE' : 'CHAT.RUN_PASSED_OTHER',
                    {
                      count: cases.passed,
                    },
                  ),
                ]),
          ]),
      ...(bugs === 0
        ? []
        : [
            t(bugs === 1 ? 'SIDEBAR.META_BUG_ONE' : 'SIDEBAR.META_BUG_OTHER', {
              count: bugs,
            }),
          ]),
    ].join(' · ');

    Run.alert({
      workspaceId: workspace.id,
      runId: run.id,
      title: t(
        isExploration
          ? run.endedBy === 'broke'
            ? 'RUN.NOTICE_EXPLORE_BROKE'
            : 'RUN.NOTICE_EXPLORED'
          : run.endedBy === 'broke'
            ? 'RUN.NOTICE_BROKE'
            : 'RUN.NOTICE_FINISHED',
        { id: run.id },
      ),
      body: t('RUN.NOTICE_BODY', { workspace: workspace.name, tally }),
    });
  };

  const announceQuestion = (props: { workspaceId: string; question: IRunQuestion }) => {
    const workspace = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === props.workspaceId);
    const live = workspace?.live;

    if (!workspace || !live || live.isDone) return;

    if (useSettingsStore.getState().runAlert !== 'system') return;

    Run.alert({
      workspaceId: workspace.id,
      runId: live.id,
      title: t('RUN.NOTICE_ASKED', { workspace: workspace.name }),
      body: props.question.question,
    });
  };

  const onRunEvent = useEffectEvent((event: IRunEvent) => {
    if (event.kind === 'doing')
      markDoing({ workspaceId: event.workspaceId, index: event.index });
    else if (event.kind === 'streaming')
      markStreaming({ workspaceId: event.workspaceId, url: event.url });
    else if (event.kind === 'note')
      landNote({ workspaceId: event.workspaceId, text: event.text, who: agent });
    else if (event.kind === 'cost')
      landCost({ workspaceId: event.workspaceId, costUsd: event.costUsd });
    else if (event.kind === 'finding')
      landFinding({ workspaceId: event.workspaceId, finding: event.finding });
    else if (event.kind === 'asked') {
      landAsked({ workspaceId: event.workspaceId, question: event.question });
      announceQuestion({ workspaceId: event.workspaceId, question: event.question });
    } else if (event.kind === 'answered') {
      landAnswered({ workspaceId: event.workspaceId, asked: event.asked });
      if (event.asked.answer.kind === 'secret' && event.asked.answer.isKept)
        void Variables.list().then(loadVariables);
    } else if (event.kind === 'step') landStep(event.outcome);
    else if (event.kind === 'explored')
      landExplored({
        workspaceId: event.workspaceId,
        summary: event.summary,
        cases: event.cases,
      });
    else if (event.kind === 'done') {
      const runId = endingOf(event.workspaceId);

      landRunDone(event.workspaceId);
      announce({ workspaceId: event.workspaceId, runId });
      reviewWorkspace(event.workspaceId);
    } else if (event.kind === 'video')
      landVideo({
        workspaceId: event.workspaceId,
        runId: event.runId,
        video: event.video,
      });
    else {
      const runId = endingOf(event.workspaceId);

      landRunFailed({
        workspaceId: event.workspaceId,
        text: t(RUN_FAILURE_KEYS[event.failure.reason], { ...event.failure, agent }),
        detail: event.failure.reason === 'other' ? (event.failure.detail ?? null) : null,
      });
      announce({ workspaceId: event.workspaceId, runId });
      reviewWorkspace(event.workspaceId);
    }
  });

  const onOpenRun = useEffectEvent((run: IRunRef) => {
    openRun(run);
  });

  useEffect(() => Run.onEvent(onRunEvent), []);

  useEffect(() => Run.onOpen(onOpenRun), []);

  const reviewOnLoad = useEffectEvent(() => {
    reviewAll();
  });

  useEffect(() => {
    if (isLoaded) reviewOnLoad();
  }, [isLoaded, trackers]);

  useEffect(() => {
    if (!isLoaded) return;

    void Run.inFlight().then((runs) => {
      const { agents } = useMachineStore.getState();
      const { agent } = useSettingsStore.getState();

      for (const run of runs)
        resumeRun({
          run,
          by: walkedByOf({
            agent: agents.find(({ id }) => id === run.agentId)?.name ?? agent,
            model: run.model,
            targetKind: run.targetKind,
            agents,
          }),
        });
    });
  }, [isLoaded, resumeRun]);
};

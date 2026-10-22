import type { IBugReportWords, IFilingShot } from '@/modules/Bug/types';
import type { BugFiling, IssueTarget } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { BUG_REPORT } from '@/modules/Bug/constants';
import { bugReportOf, filingPlanOf } from '@/modules/Bug/library';
import { bugVideoOf, failedRequestsNear, formatClock } from '@/modules/Run';
import { Bugs, Run } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useSendBug = () => {
  const { t } = useTranslation();
  const landFiled = useWorkspaceStore((state) => state.landFiled);
  const updateProject = useAppStore((state) => state.updateProject);

  const words: IBugReportWords = {
    steps: t('FILING.REPORT_STEPS'),
    expected: t('FILING.REPORT_EXPECTED'),
    got: t('FILING.REPORT_GOT'),
    requests: t('FILING.REPORT_REQUESTS'),
    where: t('FILING.REPORT_WHERE'),
    app: t('FILING.REPORT_APP'),
    target: t('FILING.REPORT_TARGET'),
    run: t('FILING.REPORT_RUN'),
    runLine: (line) => t('FILING.REPORT_RUN_LINE', line),
    seen: t('FILING.REPORT_SEEN'),
    seenRuns: (count) => (count > 1 ? t('BUG.SEEN_RUNS', { count }) : t('BUG.SEEN_ONCE')),
    story: t('FILING.REPORT_STORY'),
    caughtBy: t('FILING.REPORT_CAUGHT_BY'),
    agentLine: ({ agent, model }) =>
      t('FILING.REPORT_AGENT_LINE', { agent, model: model ?? t('MODEL.AGENT_DEFAULT') }),
    noAnswer: t('FILING.REPORT_NO_ANSWER'),
    attached: (files) => t('FILING.REPORT_ATTACHED', { files: files.join(', ') }),
    foundWith: t('FILING.REPORT_FOUND_WITH'),
  };
  const nameOf = (props: { id: string; shot: IFilingShot }) =>
    props.shot.kind === 'again'
      ? t('FILING.NAME_AGAIN', { id: props.id, run: props.shot.run ?? '' })
      : props.shot.kind === 'broke'
        ? t('FILING.NAME_BROKE', { id: props.id })
        : t('FILING.NAME_BEFORE', { id: props.id });
  const labelOf = (shot: IFilingShot) =>
    shot.kind === 'again'
      ? t('FILING.FILE_AGAIN', { run: shot.run ?? '' })
      : shot.kind === 'broke'
        ? t('FILING.FILE_BROKE')
        : t('FILING.FILE_BEFORE');

  return {
    send: async (props: {
      filingId: string;
      workspaceId: string;
      bugId: string;
      target: IssueTarget;
      title: string;
      onReady: () => void;
    }): Promise<BugFiling> => {
      const workspace = useWorkspaceStore
        .getState()
        .workspaces.find(({ id }) => id === props.workspaceId);
      const bug = workspace?.bugs.find(({ id }) => id === props.bugId);

      if (workspace === undefined || bug === undefined)
        return { isFiled: false, failure: 'unexpected', said: '' };

      const project =
        useAppStore.getState().projects.find(({ id }) => id === workspace.projectId) ??
        null;
      const target = project?.targets.find(({ id }) => id === workspace.targetId);
      const plan = filingPlanOf({ workspace, bug, tracker: props.target.tracker });
      const run = plan.videoRun;
      const moment = plan.moment;
      const [recording, entries] = await Promise.all([
        run === null
          ? null
          : Run.replayVideo({ workspaceId: workspace.id, runId: run.id }),
        moment === null
          ? null
          : Run.network({ workspaceId: workspace.id, runId: moment.runId }),
      ]);
      const made =
        run === null
          ? null
          : bugVideoOf({
              workspaceId: workspace.id,
              run,
              bug,
              recording,
              clipName: t('FILING.NAME_CLIP', { id: bug.id }),
              recordingName: t('FILING.NAME_RECORDING', { id: bug.id, run: run.id }),
            });
      const video = made?.video ?? null;
      const report = bugReportOf({
        bug,
        title: props.title,
        app: target?.kind === 'web' ? target.value : null,
        story: plan.story,
        requests:
          moment === null || moment.at === null || entries === null
            ? []
            : failedRequestsNear({
                entries,
                at: moment.at,
                beforeMs: BUG_REPORT.requestsBeforeMs,
                afterMs: BUG_REPORT.requestsAfterMs,
                limit: BUG_REPORT.requests,
              }),
        attached: [
          ...plan.shots.map(labelOf),
          ...(video === null
            ? []
            : [
                video.kind === 'clip'
                  ? t('FILING.FILE_CLIP')
                  : t('FILING.FILE_RECORDING', { at: formatClock(made?.atMs ?? 0) }),
              ]),
        ],
        words,
      });

      props.onReady();

      const filing = await Bugs.file({
        filingId: props.filingId,
        target: props.target,
        story: props.target.tracker === 'jira' ? (plan.story?.key ?? null) : null,
        report,
        shots: plan.shots.map((shot) => ({
          name: nameOf({ id: bug.id, shot }),
          file: shot.file,
          src: shot.src,
        })),
        video,
      });

      if (!filing.isFiled) return filing;

      landFiled({ workspaceId: workspace.id, bugId: bug.id, issue: filing.issue });

      const current = useAppStore
        .getState()
        .projects.find(({ id }) => id === workspace.projectId);

      if (current !== undefined) updateProject({ ...current, issueTarget: props.target });

      return filing;
    },
  };
};

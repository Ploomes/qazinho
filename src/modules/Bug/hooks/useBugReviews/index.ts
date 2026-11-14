import type { IBug, IBugReview, IBugUpdateWords } from '@/modules/Bug/types';
import type { BugReview, BugVideo, IEvidenceShot, INetworkEntry } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { BUG_REPORT, BUG_REVIEW_SAID } from '@/modules/Bug/constants';
import { reviewSightingsOf, unreviewedOf, updateReportOf } from '@/modules/Bug/library';
import { bugVideoOf, failedRequestsNear, formatClock } from '@/modules/Run';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import { Bugs, Run } from '@/services';
import {
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useBugReviews = () => {
  const { t } = useTranslation();
  const landReview = useWorkspaceStore((state) => state.landReview);

  const words: IBugUpdateWords = {
    regression: t('BUG_UPDATE.REGRESSION_LINE'),
    seenAgain: t('BUG_UPDATE.SEEN_AGAIN'),
    runLine: (line) => t('FILING.REPORT_RUN_LINE', line),
    attached: (files) => t('FILING.REPORT_ATTACHED', { files: files.join(', ') }),
  };
  const trackerOf = (bug: IBug) =>
    INTEGRATIONS.find(({ id }) => id === bug.filed?.tracker)?.name ?? '';
  const shortSaid = (said: string) => {
    const line = said.trim().split('\n')[0]?.trim() ?? '';

    return line.length > BUG_REVIEW_SAID.maxChars ? '' : line;
  };
  const workspaceOf = (workspaceId: string) =>
    useWorkspaceStore.getState().workspaces.find(({ id }) => id === workspaceId) ?? null;
  const land = (props: {
    workspaceId: string;
    bugId: string;
    review: Partial<IBugReview> & Pick<IBugReview, 'runs' | 'state'>;
  }) => {
    landReview({
      workspaceId: props.workspaceId,
      bugId: props.bugId,
      review: {
        verdict: null,
        reason: '',
        comment: '',
        url: null,
        error: '',
        at: new Date().toISOString(),
        ...props.review,
      },
    });
  };

  const reviewBug = async (props: { workspaceId: string; bugId: string }) => {
    const { workspaceId } = props;
    const workspace = workspaceOf(workspaceId);
    const bug = workspace?.bugs.find(({ id }) => id === props.bugId);

    if (
      workspace === null ||
      bug === undefined ||
      bug.filed === null ||
      bug.review?.state === 'reviewing' ||
      bug.review?.state === 'posting'
    )
      return;

    const sightings = unreviewedOf(bug);

    if (sightings.length === 0) return;

    const tracker = bug.filed.tracker;

    if (!useSetupStore.getState().integrations.some(({ id }) => id === tracker)) return;

    const runs = sightings.map(({ runId }) => runId);
    const { agent, model, language } = useSettingsStore.getState();
    const agentId =
      useMachineStore.getState().agents.find(({ name }) => name === agent)?.id ??
      'claude-code';

    land({ workspaceId, bugId: bug.id, review: { runs, state: 'reviewing' } });

    const failed: Record<string, INetworkEntry[]> = Object.fromEntries(
      await Promise.all(
        sightings.map(async (seen) => {
          const entries = await Run.network({ workspaceId, runId: seen.runId });

          return [
            seen.runId,
            entries === null || seen.at === null
              ? []
              : failedRequestsNear({
                  entries,
                  at: seen.at,
                  beforeMs: BUG_REPORT.requestsBeforeMs,
                  afterMs: BUG_REPORT.requestsAfterMs,
                  limit: BUG_REPORT.requests,
                }),
          ] as const;
        }),
      ),
    );
    const result = await Bugs.review({
      workspaceId,
      bugId: bug.id,
      agentId,
      model,
      language,
      issue: bug.filed,
      bug: {
        title: bug.title,
        expected: bug.expected,
        got: bug.got,
        body: bug.body,
        caseTitle: bug.caseTitle,
      },
      sightings: reviewSightingsOf({ workspace, bug, sightings, failed }),
    }).catch((reason: unknown): BugReview => ({
      isReviewed: false,
      failure: 'agent',
      said: reason instanceof Error ? reason.message : String(reason),
    }));
    const names = { agent, key: bug.filed.key, tracker: trackerOf(bug) };

    land({
      workspaceId,
      bugId: bug.id,
      review: result.isReviewed
        ? {
            runs,
            state: result.verdict === 'nothing-new' ? 'nothing-new' : 'suggested',
            verdict: result.verdict,
            reason: result.reason,
            comment: result.comment,
          }
        : {
            runs,
            state: 'failed',
            reason: [
              t(
                result.failure === 'tracker'
                  ? 'BUG_UPDATE.FAILED_TRACKER'
                  : 'BUG_UPDATE.FAILED_AGENT',
                names,
              ),
              shortSaid(result.said),
            ]
              .filter((part) => part !== '')
              .join(' '),
          },
    });
  };

  const reviewWorkspace = async (workspaceId: string) => {
    for (const { id } of workspaceOf(workspaceId)?.bugs ?? [])
      await reviewBug({ workspaceId, bugId: id });
  };

  return {
    reviewWorkspace: (workspaceId: string) => {
      void reviewWorkspace(workspaceId);
    },
    post: async (props: { workspaceId: string; bugId: string; comment: string }) => {
      const workspace = workspaceOf(props.workspaceId);
      const bug = workspace?.bugs.find(({ id }) => id === props.bugId);
      const review = bug?.review ?? null;

      if (
        workspace === null ||
        bug === undefined ||
        bug.filed === null ||
        review === null
      )
        return;

      const sightings = bug.sightings.filter(({ runId }) => review.runs.includes(runId));
      const isJira = bug.filed.tracker === 'jira';
      const pictured = isJira
        ? sightings.filter(({ shot }) => shot.file !== null || shot.src !== null)
        : [];
      const shots: IEvidenceShot[] = pictured.map(({ runId, shot }) => ({
        name: t('FILING.NAME_AGAIN', { id: bug.id, run: runId }),
        file: shot.file,
        src: shot.src,
      }));
      const latest = sightings.at(-1);
      const run = workspace.runs.find(({ id }) => id === latest?.runId);

      landReview({
        workspaceId: workspace.id,
        bugId: bug.id,
        review: { ...review, state: 'posting', comment: props.comment, error: '' },
      });

      const made =
        !isJira || run === undefined || run.video === null
          ? null
          : bugVideoOf({
              workspaceId: workspace.id,
              run,
              bug,
              recording: await Run.replayVideo({
                workspaceId: workspace.id,
                runId: run.id,
              }),
              clipName: t('BUG_UPDATE.NAME_CLIP', { id: bug.id, run: run.id }),
              recordingName: t('FILING.NAME_RECORDING', { id: bug.id, run: run.id }),
            });
      const video: BugVideo | null = made?.video ?? null;
      const posted = await Bugs.comment({
        issue: bug.filed,
        report: updateReportOf({
          verdict: review.verdict,
          comment: props.comment,
          sightings,
          attached: [
            ...pictured.map(({ runId }) => t('FILING.FILE_AGAIN', { run: runId })),
            ...(video === null
              ? []
              : [
                  video.kind === 'clip'
                    ? t('FILING.FILE_CLIP')
                    : t('FILING.FILE_RECORDING', { at: formatClock(made?.atMs ?? 0) }),
                ]),
          ],
          words,
        }),
        shots,
        video,
      }).catch(
        (reason: unknown) =>
          ({
            isPosted: false,
            failure: 'unexpected',
            said: reason instanceof Error ? reason.message : String(reason),
          }) as const,
      );

      landReview({
        workspaceId: workspace.id,
        bugId: bug.id,
        review: posted.isPosted
          ? {
              ...review,
              state: 'posted',
              comment: props.comment,
              url: posted.url,
              error: '',
            }
          : {
              ...review,
              state: 'suggested',
              comment: props.comment,
              error: [
                t('BUG_UPDATE.FAILED_POST', { tracker: trackerOf(bug) }),
                posted.said,
              ]
                .filter((part) => part !== '')
                .join(' '),
            },
      });
    },
    dismiss: (props: { workspaceId: string; bugId: string }) => {
      const review = workspaceOf(props.workspaceId)?.bugs.find(
        ({ id }) => id === props.bugId,
      )?.review;

      if (review !== undefined && review !== null)
        landReview({ ...props, review: { ...review, state: 'dismissed' } });
    },
    review: (props: { workspaceId: string; bugId: string }) => {
      void reviewBug(props);
    },
  };
};

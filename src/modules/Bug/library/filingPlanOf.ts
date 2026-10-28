import type { IBug, IFilingPlan, IFilingShot } from '@/modules/Bug/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IssueTracker } from '@/shared/types';
import { appearancesOf } from './appearancesOf';
import { pasteShotOf } from './pasteShotOf';

/**
 * O que mandar um bug a um tracker leva: o Jira recebe telas, vídeo e história; o GitHub
 * recebe as palavras.
 */
export function filingPlanOf(props: {
  workspace: IWorkspace;
  bug: IBug;
  tracker: IssueTracker;
}): IFilingPlan {
  const { workspace, bug } = props;
  const isJira = props.tracker === 'jira';
  const seen = appearancesOf(bug);
  const recorded = seen.findLast((one) =>
    workspace.runs.some(({ id, video }) => id === one.runId && video !== null),
  );
  const videoRun = isJira
    ? (workspace.runs.find(({ id }) => id === recorded?.runId) ?? null)
    : null;
  const last = bug.sightings.at(-1) ?? null;
  const shots: IFilingShot[] = isJira
    ? [
        ...bug.shots.map((shot) => ({
          kind: shot.isBad ? ('broke' as const) : ('before' as const),
          run: null,
          file: shot.file,
          src: shot.src,
        })),
        ...(last === null
          ? []
          : [
              {
                kind: 'again' as const,
                run: last.runId,
                file: last.shot.file,
                src: last.shot.src,
              },
            ]),
      ].filter(({ file, src }) => file !== null || src !== null)
    : [];
  const story =
    workspace.issue?.source === 'jira'
      ? { key: workspace.issue.key, url: workspace.issue.url }
      : null;

  return {
    shots,
    videoRun,
    moment: seen.findLast(({ at }) => at !== null) ?? null,
    story,
    screen: pasteShotOf(bug),
    steps: [
      'ready',
      'issue',
      ...(shots.length > 0 ? (['screens'] as const) : []),
      ...(videoRun !== null ? (['video'] as const) : []),
      ...(isJira && story !== null ? (['link'] as const) : []),
    ],
  };
}

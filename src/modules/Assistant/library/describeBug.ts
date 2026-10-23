import type { IWorkspace } from '@/modules/Workspace/types';
import { appearancesOf } from '@/modules/Bug/library';

/** One bug of a workspace in full for the assistant: what was expected and what showed, the Figma frame it is off, how to reproduce it, where it was caught, and the issue it became. */
export function describeBug(props: { workspace: IWorkspace; bugId: string }): {
  text: string;
  isError: boolean;
} {
  const { workspace } = props;
  const bug = workspace.bugs.find(
    ({ id }) => id.toLowerCase() === props.bugId.trim().toLowerCase(),
  );

  if (bug === undefined)
    return workspace.bugs.length === 0
      ? { text: `${workspace.id} "${workspace.name}" has no bugs.`, isError: true }
      : {
          text: `${workspace.id} has no bug "${props.bugId}". Its bugs are ${workspace.bugs.map(({ id }) => id).join(', ')}.`,
          isError: true,
        };

  return {
    text: [
      `Bug ${bug.id} of ${workspace.id} "${workspace.name}": "${bug.title}", severity ${bug.severity}.`,
      `Caught in ${bug.runId} at ${bug.runWhen}, on ${bug.caseId} "${bug.caseTitle}" step ${String(bug.stepNumber)}${bug.isIncidental ? ', on the side of that step' : ''}${bug.isDismissed ? ', and the QA said it is no bug' : ''}, walked on ${bug.target} by ${bug.agent}${bug.modelName === null ? '' : ` (${bug.modelName})`}.`,
      ...(bug.frame === null
        ? []
        : [
            `It is off the design: the screen differs from frame ${bug.frame}${workspace.design === null ? '' : ` of the Figma design "${workspace.design.name}"`}.`,
          ]),
      `Expected: ${bug.expected}`,
      `Got: ${bug.got}`,
      ...(bug.body.trim() === '' ? [] : [bug.body]),
      ...(bug.repro.length === 0
        ? []
        : [
            'To reproduce:',
            ...bug.repro.map(
              (step, index) =>
                `${String(index + 1)}. ${step.action}${step.isBad ? ' ← it breaks here' : ''}`,
            ),
          ]),
      ...(bug.filed === null
        ? ['Not sent to a tracker yet.']
        : [
            `Filed as ${bug.filed.key} in ${bug.filed.tracker === 'jira' ? 'Jira' : 'GitHub'}: ${bug.filed.url}`,
          ]),
      ...(bug.filed !== null && bug.review?.state === 'suggested'
        ? [
            `${bug.review.verdict === 'regression' ? 'It came back after the issue was closed, and an' : 'An'} update for ${bug.filed.key} waits on the QA in Bugs: ${bug.review.reason}`,
          ]
        : []),
      `Seen in ${String(bug.seenRuns)} run${bug.seenRuns === 1 ? '' : 's'}${bug.sightings.length === 0 ? '' : ` (${[...new Set(appearancesOf(bug).map(({ runId }) => runId))].join(', ')})`}${bug.shots.length + bug.sightings.length === 0 ? '' : `, with ${String(bug.shots.length + bug.sightings.length)} screenshot${bug.shots.length + bug.sightings.length === 1 ? '' : 's'} in Bugs`}.`,
    ].join('\n'),
    isError: false,
  };
}

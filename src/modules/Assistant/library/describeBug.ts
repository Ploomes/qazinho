import type { IWorkspace } from '@/modules/Workspace/types';

/** One bug of a workspace in full for the assistant: what was expected and what showed, how to reproduce it, and where it was caught. */
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
      `Caught in ${bug.runId} at ${bug.runWhen}, on ${bug.caseId} "${bug.caseTitle}" step ${String(bug.stepNumber)}${bug.isIncidental ? ', on the side of that step' : ''}, walked on ${bug.target} by ${bug.agent}${bug.modelName === null ? '' : ` (${bug.modelName})`}.`,
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
      `Seen in ${String(bug.seenRuns)} run${bug.seenRuns === 1 ? '' : 's'}${bug.shots.length === 0 ? '' : `, with ${String(bug.shots.length)} screenshot${bug.shots.length === 1 ? '' : 's'} in Bugs`}.`,
    ].join('\n'),
    isError: false,
  };
}

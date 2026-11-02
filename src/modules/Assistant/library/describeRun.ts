import type { IWorkspace } from '@/modules/Workspace/types';
import { isSeenIn } from '@/modules/Bug/library';
import { runFactsOf } from '@/modules/Chat/library';

/**
 * Uma run de um workspace para o assistente, passo a passo com as notas e os bugs, a
 * última quando nenhuma é nomeada, ou por que não há.
 */
export function describeRun(props: { workspace: IWorkspace; runId: string | null }): {
  text: string;
  isError: boolean;
} {
  const { workspace } = props;
  const live = workspace.live;
  const wanted = props.runId?.trim().toLowerCase() ?? null;

  if (live !== null && !live.isDone && (wanted === null || wanted === live.id))
    return {
      text: `${live.id} of ${workspace.id} is still ${live.isRunning ? 'going on' : 'paused'}: ${String(live.outcomes.length)} ${live.kind === 'explore' ? 'screens noted' : 'steps walked'} so far, ${String(live.outcomes.filter(({ verdict }) => verdict === 'passed').length)} passed, ${String(live.outcomes.filter(({ verdict }) => verdict === 'failed').length)} failed.`,
      isError: false,
    };

  const run =
    wanted === null
      ? workspace.runs[0]
      : workspace.runs.find(({ id }) => id.toLowerCase() === wanted);

  if (run === undefined)
    return workspace.runs.length === 0
      ? { text: `${workspace.id} "${workspace.name}" has no runs yet.`, isError: false }
      : {
          text: `${workspace.id} has no run "${props.runId ?? ''}". Its runs are ${workspace.runs.map(({ id }) => id).join(', ')}.`,
          isError: true,
        };

  const bugs = workspace.bugs.filter((bug) => isSeenIn({ bug, runId: run.id }));

  return {
    text: [
      `Run ${run.id} of ${workspace.id} "${workspace.name}"${run.meta === workspace.name ? '' : `, ${run.meta}`}:`,
      ...runFactsOf({ run, isBrief: false }),
      ...workspace.chat.flatMap((message) =>
        message.kind === 'note' && message.runId === run.id
          ? [`note: ${message.text}`]
          : [],
      ),
      ...(bugs.length === 0
        ? []
        : [
            `Bugs it found: ${bugs.map((bug) => `${bug.id} "${bug.title}" (${bug.severity})`).join(', ')}.`,
          ]),
      ...(run.video === null ? [] : ['Its video plays back in Runs.']),
    ].join('\n'),
    isError: false,
  };
}

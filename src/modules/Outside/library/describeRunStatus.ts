import type { IWorkspace } from '@/modules/Workspace';
import type { INetworkEntry } from '@/shared/types';
import { describeRun } from '@/modules/Assistant/library';
import { flattenPlanSteps } from '@/modules/Run/library';
import { failedCallsOf } from './failedCallsOf';

/**
 * Uma run para um agente de fora: até onde foi enquanto anda; acabada, o que o assistente
 * lê mais as telas do que deu errado e os pedidos que falharam.
 */
export function describeRunStatus(props: {
  workspace: IWorkspace;
  runId: string | null;
  network: INetworkEntry[] | null;
  now: number;
}): { text: string; isError: boolean } {
  const { workspace, runId, network, now } = props;
  const live = workspace.live;
  const wanted = runId?.trim().toLowerCase() ?? null;

  if (live !== null && !live.isDone && (wanted === null || wanted === live.id)) {
    const steps =
      live.kind === 'explore'
        ? []
        : flattenPlanSteps(workspace.plan).filter(
            ({ caseId }) => live.caseIds === undefined || live.caseIds.includes(caseId),
          );
    const passed = live.outcomes.filter(({ verdict }) => verdict === 'passed').length;
    const failed = live.outcomes.filter(({ verdict }) => verdict === 'failed').length;
    const doing = steps[live.outcomes.length]?.action;
    const question = live.question;

    return {
      text: [
        `Run ${live.id} of ${workspace.id} "${workspace.name}" is ${live.isRunning ? 'still going on' : 'paused'}: ${String(live.outcomes.length)}${steps.length === 0 ? '' : ` of ${String(steps.length)}`} ${live.kind === 'explore' ? 'screens noted' : 'steps walked'}, ${String(passed)} passed, ${String(failed)} failed.`,
        ...(doing === undefined ? [] : [`Now on: ${doing}`]),
        ...(question === undefined
          ? []
          : [
              `Its agent waits for the QA${question.isSecret ? ', for a secret' : ''}: "${question.question}"${question.options.length === 0 ? '' : ` (${question.options.join(', ')})`}. Tell them: they answer in QAzinho, and it holds for at most ${String(Math.max(1, Math.ceil((question.waitsUntilMs - now) / 60_000)))} more minutes.`,
            ]),
      ].join('\n'),
      isError: false,
    };
  }

  const told = describeRun({ workspace, runId });
  const run =
    wanted === null
      ? workspace.runs[0]
      : workspace.runs.find(({ id }) => id.toLowerCase() === wanted);

  if (told.isError || run === undefined) return told;

  const screens = run.cases.flatMap((runCase) =>
    runCase.steps.flatMap((step) =>
      (step.verdict === 'failed' || step.verdict === 'blocked') && step.shotFile !== null
        ? [`  ${runCase.id} step ${String(step.number)}: ${step.shotFile}`]
        : [],
    ),
  );

  return {
    text: [
      told.text,
      ...(screens.length === 0
        ? []
        : ['Screenshots of what went wrong, as files you can read:', ...screens]),
      ...failedCallsOf(network),
    ].join('\n'),
    isError: false,
  };
}

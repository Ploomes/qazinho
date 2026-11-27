import type { IFlatStep, IStepOutcome } from '@/shared/types';
import type { IShot } from '@ploomes/qazinho-harness/engine';
import { RUN_MANUAL } from '@/main/classes/runs/RunCoordinator/constants';

/**
 * Um passo que o QA marcou num caso à mão, com a tela de quando marcou: numa falha, a
 * nota dele é o que veio e dá o título do bug.
 */
export function markedOutcomeOf(props: {
  step: IFlatStep;
  index: number;
  workspaceId: string;
  verdict: 'passed' | 'failed' | 'skipped';
  note: string;
  tookMs: number;
  at: number;
  shot: IShot | null;
}): IStepOutcome {
  const { step, verdict, note } = props;
  const isFailed = verdict === 'failed';

  return {
    workspaceId: props.workspaceId,
    caseId: step.caseId,
    stepNumber: step.numberInCase,
    index: props.index,
    action: step.action,
    expected: step.expected,
    verdict,
    why: note,
    got: isFailed ? note : '',
    title: isFailed ? titleOf({ note, action: step.action }) : '',
    severity: 'medium',
    tookMs: props.tookMs,
    at: props.at,
    screenshot: props.shot?.dataUrl ?? null,
    shotFile: props.shot?.file ?? null,
    by: 'qa',
    ...(step.frame === undefined ? {} : { frame: step.frame }),
  };
}

function titleOf(props: { note: string; action: string }): string {
  const [line = ''] = props.note.split('\n');
  const said = line.trim().length > 0 ? line.trim() : props.action.trim();

  return said.length > RUN_MANUAL.titleChars
    ? `${said.slice(0, RUN_MANUAL.titleChars - 1).trimEnd()}…`
    : said;
}

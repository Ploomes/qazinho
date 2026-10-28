import type { IStepOutcome } from '@/shared/types';
import type { IExploredScreen } from '@salve-software/qazinho-harness';
import type { IShot } from '@salve-software/qazinho-harness/engine';
import { EXPLORATION } from '@/shared/constants';

/**
 * Uma tela que o explorador alcançou, como um passo do caso único da exploração: o nome,
 * para que serve, e a imagem.
 */
export function exploredOutcome(props: {
  workspaceId: string;
  screen: IExploredScreen;
  number: number;
  tookMs: number;
  at: number;
  shot: IShot | null;
}): IStepOutcome {
  const { workspaceId, screen, number, tookMs, at, shot } = props;

  return {
    workspaceId,
    caseId: EXPLORATION.caseId,
    stepNumber: number,
    index: number - 1,
    action: screen.name,
    expected: '',
    verdict: 'passed',
    why: screen.about,
    got: '',
    title: '',
    severity: 'low',
    tookMs,
    at,
    screenshot: shot?.dataUrl ?? null,
    shotFile: shot?.file ?? null,
  };
}

import type { IExploredScreen } from '@/harness';
import type { IShot } from '@/main/classes/devices/types';
import type { IStepOutcome } from '@/shared/types';
import { EXPLORATION } from '@/shared/constants';

/** A screen the explorer reached, as a step of the exploration's one case: its name, what it is for, and its picture. */
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

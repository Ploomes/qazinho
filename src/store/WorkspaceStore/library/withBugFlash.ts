import type { IBugFlash } from '@/modules/Device/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/shared/types';
import { BUG_FLASH } from '@/modules/Device/constants';
import { bugFlashOf } from '@/modules/Device/library';

/** A fila de bugs pegos depois de mais um, sem deixar a tela atrasar demais. */
export function withBugFlash(props: {
  flashes: Record<string, IBugFlash[]>;
  workspaces: IWorkspace[];
  outcome: IStepOutcome;
  isIncidental: boolean;
}): Record<string, IBugFlash[]> {
  const { flashes, workspaces, outcome, isIncidental } = props;
  const { workspaceId } = outcome;
  const workspace = workspaces.find(({ id }) => id === workspaceId);
  const flash =
    workspace === undefined ? null : bugFlashOf({ workspace, outcome, isIncidental });

  if (flash === null) return flashes;

  const [showing, ...waiting] = flashes[workspaceId] ?? [];

  return {
    ...flashes,
    [workspaceId]: [
      ...(showing === undefined ? [] : [showing]),
      ...[...waiting, flash].slice(-BUG_FLASH.waitingKept),
    ],
  };
}

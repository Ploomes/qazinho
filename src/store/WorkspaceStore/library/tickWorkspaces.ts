import type { IWorkspace } from '@/modules/Workspace';
import { tickLive } from './tickLive';

/**
 * Moves the clock of every run that is going; with none going it hands back the same
 * list, so nothing re-renders.
 */
export function tickWorkspaces(props: {
  workspaces: IWorkspace[];
  seconds: number;
}): IWorkspace[] {
  const ticked = props.workspaces.map((workspace) =>
    tickLive({ workspace, seconds: props.seconds }),
  );

  return ticked.some((workspace, index) => workspace !== props.workspaces[index])
    ? ticked
    : props.workspaces;
}

import type { IWorkspace } from '@/modules/Workspace';
import { tickLive } from './tickLive';

/**
 * Avança o relógio de toda run em andamento; sem nenhuma, devolve a mesma lista, para
 * nada renderizar de novo.
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

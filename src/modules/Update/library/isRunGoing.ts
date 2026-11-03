import type { IWorkspace } from '@/modules/Workspace';

/** Se alguma run anda agora: reiniciar o app para atualizar a derrubaria. */
export function isRunGoing(workspaces: Pick<IWorkspace, 'live'>[]): boolean {
  return workspaces.some(({ live }) => live !== null && !live.isDone);
}

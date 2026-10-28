/**
 * Uma run que acabou de terminar, dita dentro do app; `key` é nova a cada vez, então um
 * segundo aviso substitui o primeiro.
 */
export interface IRunNotice {
  key: string;
  workspaceId: string;
  runId: string;
}

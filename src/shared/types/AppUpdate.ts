/**
 * Em que pé a atualização do app está, e se ela é obrigatória; uma cópia da Microsoft
 * Store só atualiza pela loja.
 */
export type AppUpdate = { isRequired: boolean } & (
  | { phase: 'idle' }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'ready'; version: string }
  | { phase: 'installing' }
  | { phase: 'failed' }
  | { phase: 'store' }
);

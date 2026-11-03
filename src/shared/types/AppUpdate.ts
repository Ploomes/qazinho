/**
 * Em que pé a atualização do app está, e se ela é obrigatória: quem está logado numa
 * versão que a API recusa só consegue atualizar.
 */
export type AppUpdate = { isRequired: boolean } & (
  | { phase: 'idle' }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'ready'; version: string }
  | { phase: 'failed' }
);

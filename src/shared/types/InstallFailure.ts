/** Por que uma instalação não terminou, para a página dizer no idioma do QA. */
export type InstallFailure =
  | { reason: 'busy' }
  | { reason: 'missing'; tool: string }
  | { reason: 'stopped'; tool: string; code: number }
  | { reason: 'said'; text: string }
  | { reason: 'no-bridge' };

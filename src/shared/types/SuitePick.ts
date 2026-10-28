import type { ISuite } from './ISuite';

/**
 * Como foi conectar uma suíte: a suíte lida da pasta escolhida, o QA fechando o seletor,
 * ou uma pasta sem suíte de Playwright.
 */
export type SuitePick =
  | { kind: 'picked'; suite: ISuite }
  | { kind: 'cancelled' }
  | { kind: 'failed'; reason: 'no-playwright' };

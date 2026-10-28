import type { BugFiling, IFilingEvent } from '@/shared/types';

/**
 * O que faz o envio de um bug andar: a evidência ficou pronta, a main deu um passo, ou
 * terminou.
 */
export type FilingChange =
  | { kind: 'ready' }
  | { kind: 'step'; event: IFilingEvent }
  | { kind: 'ended'; result: BugFiling };

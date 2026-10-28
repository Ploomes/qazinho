import type { ISuiteChange } from '@/shared/types';
import type { IChangeAnswer } from '@salve-software/qazinho-harness';

/**
 * Como o turno do agente numa mudança foi: quebrou, com a mudança como está, ou
 * respondeu, null quando o QA o parou.
 */
export type ChangeTurn =
  | { kind: 'broke'; change: ISuiteChange }
  | { kind: 'answered'; change: ISuiteChange; answer: IChangeAnswer | null };

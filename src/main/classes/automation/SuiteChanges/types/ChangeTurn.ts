import type { IChangeAnswer } from '@/harness';
import type { ISuiteChange } from '@/shared/types';

/** How the agent's turn on a change went: it broke, with the change as it stands, or it answered, null once the QA stopped it. */
export type ChangeTurn =
  | { kind: 'broke'; change: ISuiteChange }
  | { kind: 'answered'; change: ISuiteChange; answer: IChangeAnswer | null };

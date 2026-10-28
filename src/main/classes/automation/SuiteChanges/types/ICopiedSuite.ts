import type { IChangeWork } from './IChangeWork';
import type { ISuiteChange } from '@/shared/types';

/**
 * Uma mudança depois que a cópia dela foi feita, ou não: a mudança, onde trabalha, e as
 * últimas mensagens de commit do time.
 */
export interface ICopiedSuite {
  change: ISuiteChange;
  work: IChangeWork | null;
  commits: string[];
}

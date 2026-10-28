import type { ISuiteChange } from './ISuiteChange';

/**
 * Como foi mandar uma mudança: a mudança como está agora, ou o passo que falhou com o que
 * o git ou o GitHub disse, e a mudança até onde chegou.
 */
export type SuiteShipOutcome =
  | { isOk: true; change: ISuiteChange }
  | {
      isOk: false;
      step: 'commit' | 'push' | 'pull-request';
      said: string;
      change: ISuiteChange;
    };

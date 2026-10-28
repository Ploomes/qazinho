import type { SuiteShipWay } from './SuiteShipWay';

/**
 * Para onde uma mudança foi depois que o QA a aprovou: o jeito como saiu, e a página que
 * a mostra, o pull request ou onde abrir um, quando há.
 */
export interface ISuiteShipped {
  way: SuiteShipWay;
  url: string | null;
}

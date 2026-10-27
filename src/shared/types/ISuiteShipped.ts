import type { SuiteShipWay } from './SuiteShipWay';

/**
 * Where a change went once the QA approved it: the way it left, and the page that shows
 * it, the pull request or where to open one, when there is one.
 */
export interface ISuiteShipped {
  way: SuiteShipWay;
  url: string | null;
}

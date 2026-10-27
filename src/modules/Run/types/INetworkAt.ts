import type { IRequestAt } from './IRequestAt';

/**
 * The network as one moment of the video shows it: the latest requests, how many started
 * of how many the run made, the errors so far, and the files kept out.
 */
export interface INetworkAt {
  rows: IRequestAt[];
  shown: number;
  total: number;
  errors: number;
  earlier: number;
  files: number;
}

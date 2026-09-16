import type { IProcessSample } from './IProcessSample';

/** What the machine is paying for gocrash right now, app included. */
export interface IResourceSnapshot {
  cpu: number;
  ramMb: number;
  ramCeilingGb: number;
  processes: IProcessSample[];
}

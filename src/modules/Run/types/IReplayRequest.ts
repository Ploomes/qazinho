import type { RequestOutcome } from './RequestOutcome';

/**
 * A request placed on a run's video: where it starts and ends there, with its address
 * split into another host and the path; `toMs` is null for one that never ended.
 */
export interface IReplayRequest {
  id: number;
  method: string;
  url: string;
  host: string | null;
  path: string;
  type: string;
  isFile: boolean;
  outcome: RequestOutcome;
  status: number | null;
  failure: string | null;
  fromMs: number;
  toMs: number | null;
  durationMs: number | null;
  size: number | null;
}

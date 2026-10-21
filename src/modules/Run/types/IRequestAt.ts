import type { IReplayRequest } from './IReplayRequest';

/** A request as one moment of the video shows it: ended or still waiting, and for how long so far. */
export interface IRequestAt {
  request: IReplayRequest;
  isDone: boolean;
  elapsedMs: number;
}

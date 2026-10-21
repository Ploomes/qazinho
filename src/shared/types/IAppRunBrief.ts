/** A run told in a line: when it started, how it ended, and what its steps came to. */
export interface IAppRunBrief {
  id: string;
  startedAt: string;
  endedBy: 'finished' | 'stopped' | 'broke' | 'interrupted';
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
}

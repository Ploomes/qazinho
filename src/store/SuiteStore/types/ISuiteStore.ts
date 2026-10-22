import type { ISuiteLive } from './ISuiteLive';
import type { SuiteListState } from './SuiteListState';
import type { ISuite, ISuiteRun, SuiteEvent } from '@/shared/types';

/** The suites connected to the QA's projects, by project: what each holds, its tests, its runs, the run going, and the test picked on screen. */
export interface ISuiteStore {
  suites: Record<string, ISuite>;
  lists: Record<string, SuiteListState>;
  runs: Record<string, ISuiteRun[]>;
  live: Record<string, ISuiteLive>;
  picked: Record<string, string | null>;
  putSuite: (props: { projectId: string; suite: ISuite | null }) => void;
  putList: (props: { projectId: string; list: SuiteListState }) => void;
  putRuns: (props: { projectId: string; runs: ISuiteRun[] }) => void;
  hear: (event: SuiteEvent) => void;
  pickTest: (props: { projectId: string; testId: string | null }) => void;
  drop: (projectId: string) => void;
}

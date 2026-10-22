import type { ISuiteLive } from './ISuiteLive';
import type { SuiteListState } from './SuiteListState';
import type { SuiteChangeNote } from '@/modules/Automation/types';
import type {
  ISuite,
  ISuiteChange,
  ISuiteRun,
  SuiteChangeEvent,
  SuiteEvent,
} from '@/shared/types';

/** The suites connected to the QA's projects, by project: what each holds, its tests, its runs, the run going, the test picked on screen, the changes the agent made to it, and what the agent says while it changes one. */
export interface ISuiteStore {
  suites: Record<string, ISuite>;
  lists: Record<string, SuiteListState>;
  runs: Record<string, ISuiteRun[]>;
  live: Record<string, ISuiteLive>;
  picked: Record<string, string | null>;
  changes: Record<string, ISuiteChange[]>;
  changeNotes: Record<string, SuiteChangeNote[]>;
  putSuite: (props: { projectId: string; suite: ISuite | null }) => void;
  putList: (props: { projectId: string; list: SuiteListState }) => void;
  putRuns: (props: { projectId: string; runs: ISuiteRun[] }) => void;
  hear: (event: SuiteEvent) => void;
  putChanges: (props: { projectId: string; changes: ISuiteChange[] }) => void;
  hearChange: (event: SuiteChangeEvent) => void;
  pickTest: (props: { projectId: string; testId: string | null }) => void;
  drop: (projectId: string) => void;
}

import type { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import type { SuiteEvent } from '@/shared/types';

/** What the runner needs: the registry of suites, the QA's node, the settings a project's tests read, the folder it keeps what it makes in, where each run's files are served, and whom to tell as a run goes. */
export interface ISuiteRunner {
  registry: Pick<SuiteRegistry, 'pathOf' | 'runnerOf'>;
  node: () => Promise<string | null>;
  env: (projectId: string) => Promise<Record<string, string>>;
  root: string;
  urlOf: (props: { projectId: string; runId: string; file: string }) => string | null;
  onEvent: (event: SuiteEvent) => void;
  now?: () => number;
}

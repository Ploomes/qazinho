import type { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';

/** What the runner needs: the registry of suites, the QA's node, the settings a project's tests read, and the folder it keeps what it makes in. */
export interface ISuiteRunner {
  registry: Pick<SuiteRegistry, 'pathOf' | 'runnerOf'>;
  node: () => Promise<string | null>;
  env: (projectId: string) => Promise<Record<string, string>>;
  root: string;
}

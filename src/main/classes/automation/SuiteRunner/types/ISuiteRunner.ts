import type { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import type { IVariableValue } from '@/main/types';
import type { SuiteEvent } from '@/shared/types';

/**
 * What the runner needs: the suites, the QA's node, the project's settings and where runs
 * go.
 */
export interface ISuiteRunner {
  registry: Pick<SuiteRegistry, 'pathOf' | 'runnerOf'>;
  node: () => Promise<string | null>;
  env: (projectId: string) => Promise<Record<string, string>>;
  values: (projectId: string) => Promise<IVariableValue[]>;
  root: string;
  urlOf: (props: { projectId: string; runId: string; file: string }) => string | null;
  onEvent: (event: SuiteEvent) => void;
  now?: () => number;
}

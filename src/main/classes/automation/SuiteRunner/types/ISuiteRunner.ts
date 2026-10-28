import type { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import type { IVariableValue } from '@/main/types';
import type { SuiteEvent } from '@/shared/types';

/**
 * O que o runner precisa: as suítes, o node do QA, as configurações do projeto e para
 * onde as runs vão.
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

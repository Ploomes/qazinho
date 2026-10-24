import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { GitCli } from '@/main/classes/automation/GitCli';
import type { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import type { SuiteRunner } from '@/main/classes/automation/SuiteRunner';
import type { GithubCli } from '@/main/classes/integrations/GithubCli';
import type { IVariableValue } from '@/main/types';
import type { SuiteChangeEvent } from '@/shared/types';
import type { Harness, McpHost } from '@salve-software/qazinho-harness';

/** What changing a suite needs: the suites and their runner, git and gh, the QA's agent and the harness, QAzinho's tools, the project's values, the QA's PATH, where to keep each change, and whom to tell. */
export interface ISuiteChanges {
  registry: Pick<SuiteRegistry, 'pathOf' | 'runnerOf' | 'suiteOf'>;
  suites: Pick<SuiteRunner, 'check' | 'stopCheck' | 'resultOf'>;
  git: Pick<GitCli, 'run'>;
  github: Pick<GithubCli, 'api'>;
  runner: Pick<AgentRunner, 'ask' | 'cancel'>;
  harness: Pick<Harness, 'change' | 'readChange'>;
  tools: Pick<McpHost, 'attachSuite' | 'detachSuite' | 'mcpConfigFor'>;
  findCommand: (agentId: string) => Promise<string | null>;
  values: (projectId: string) => Promise<IVariableValue[]>;
  path: () => Promise<string>;
  root: string;
  onEvent: (event: SuiteChangeEvent) => void;
  now?: () => number;
}

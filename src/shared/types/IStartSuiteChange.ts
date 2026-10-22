import type { Language } from './Language';
import type { SuiteChangeAsk } from './SuiteChangeAsk';

/** A change the QA asks of their agent in a project's suite: its id, the agent and model to ask, the language it answers the QA in, the Playwright projects of the suite's config, and what to do. */
export interface IStartSuiteChange {
  projectId: string;
  changeId: string;
  agentId: string;
  model: string;
  language: Language;
  projects: string[];
  ask: SuiteChangeAsk;
}

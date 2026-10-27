import type { Language } from './Language';
import type { SuiteChangeAsk } from './SuiteChangeAsk';

/**
 * A change the QA asks of their agent in a project's suite: who answers, in what
 * language, and what.
 */
export interface IStartSuiteChange {
  projectId: string;
  changeId: string;
  agentId: string;
  model: string;
  language: Language;
  projects: string[];
  ask: SuiteChangeAsk;
}

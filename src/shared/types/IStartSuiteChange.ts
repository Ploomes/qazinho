import type { Language } from './Language';
import type { SuiteChangeAsk } from './SuiteChangeAsk';

/**
 * Uma mudança que o QA pede ao agente dele na suíte de um projeto: quem responde, em que
 * idioma, e o quê.
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

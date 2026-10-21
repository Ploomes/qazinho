import type { IAppSnapshot } from './IAppSnapshot';

/** What the page asks the assistant: the QA's own words, on the session it already has, with QAzinho as it is now. */
export interface IAssistantAsk {
  agentId: string;
  model: string;
  sessionId: string | null;
  text: string;
  app: IAppSnapshot;
}

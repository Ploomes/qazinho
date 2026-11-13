import type { ChatFailure } from './ChatFailure';
import type { IAgentTurn } from './IAgentTurn';
import type { IChatAnswer } from './IChatAnswer';
import type { ICodeSource } from './ICodeSource';
import type { IConfluencePageRef } from './IConfluencePageRef';
import type { IJiraIssueRef } from './IJiraIssueRef';
import type { StoryReadiness } from './StoryReadiness';

/**
 * Um turno de chat: o que a CLI relatou, a resposta lida dele, por que falhou quando
 * falhou, e o código, a história do Jira e a página do Confluence que ele leu.
 */
export interface IChatTurn extends IAgentTurn {
  answer: IChatAnswer | null;
  failure: ChatFailure | null;
  code: ICodeSource | null;
  story: IJiraIssueRef | null;
  readiness?: StoryReadiness;
  page: IConfluencePageRef | null;
  followed: string[];
}

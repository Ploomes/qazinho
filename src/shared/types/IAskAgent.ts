import type { IChatReference } from './IChatReference';
import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';

/** What the page asks in the chat: the QA's own words, and the workspace they are about. */
export interface IAskAgent {
  workspaceId: string;
  agentId: string;
  model: string;
  sessionId: string | null;
  text: string;
  target: ITargetUnderTest | null;
  steps: IFlatStep[];
  references: IChatReference[];
}

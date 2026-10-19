import type { IChatReference } from './IChatReference';
import type { IFlatStep } from './IFlatStep';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IViewport } from './IViewport';

/** What the page asks in the chat: the QA's own words, the workspace they are about, and how its latest runs went. */
export interface IAskAgent {
  workspaceId: string;
  agentId: string;
  model: string;
  sessionId: string | null;
  text: string;
  target: ITargetUnderTest | null;
  viewport: IViewport | null;
  steps: IFlatStep[];
  references: IChatReference[];
  runs: IChatReference[];
}

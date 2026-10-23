import type { IChatReference } from './IChatReference';
import type { ICodeAsk } from './ICodeAsk';
import type { IConfluenceAsk } from './IConfluenceAsk';
import type { IDesignLink } from './IDesignLink';
import type { IFlatStep } from './IFlatStep';
import type { IJiraAsk } from './IJiraAsk';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IVariableBrief } from './IVariableBrief';
import type { IViewport } from './IViewport';

/** What the page asks in the chat: the QA's own words, the workspace they are about, how its latest runs went, a branch, a Jira story or a Confluence page to plan from, the Figma design it is checked against, and the variables its project keeps. */
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
  code: ICodeAsk | null;
  jira: IJiraAsk | null;
  confluence: IConfluenceAsk | null;
  design: IDesignLink | null;
  variables: IVariableBrief[];
}

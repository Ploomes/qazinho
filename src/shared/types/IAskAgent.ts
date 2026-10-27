import type { IChatReference } from './IChatReference';
import type { ICodeAsk } from './ICodeAsk';
import type { IConfluenceAsk } from './IConfluenceAsk';
import type { IDesignLink } from './IDesignLink';
import type { IFlatStep } from './IFlatStep';
import type { IJiraAsk } from './IJiraAsk';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IVariableBrief } from './IVariableBrief';
import type { IViewport } from './IViewport';

/**
 * What the page asks in the chat: the QA's words, the workspace, its runs and the sources
 * to plan from.
 */
export interface IAskAgent {
  workspaceId: string;
  projectId: string;
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

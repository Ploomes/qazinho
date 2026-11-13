import type { IChatAttachment } from './IChatAttachment';
import type { IChatReference } from './IChatReference';
import type { ICodeAsk } from './ICodeAsk';
import type { IConfluenceAsk } from './IConfluenceAsk';
import type { IDesignLink } from './IDesignLink';
import type { IFlatStep } from './IFlatStep';
import type { IImportAsk } from './IImportAsk';
import type { IJiraAsk } from './IJiraAsk';
import type { IMemoryBrief } from './IMemoryBrief';
import type { IPlanDoubt } from './IPlanDoubt';
import type { ITargetUnderTest } from './ITargetUnderTest';
import type { IVariableBrief } from './IVariableBrief';
import type { IViewport } from './IViewport';

/**
 * O que a página pergunta no chat: as palavras do QA ou do agente de código dele, o
 * workspace, as runs e as fontes de onde planejar.
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
  source: IImportAsk | null;
  jira: IJiraAsk | null;
  confluence: IConfluenceAsk | null;
  design: IDesignLink | null;
  variables: IVariableBrief[];
  isFromAgent?: boolean;
  attachments?: IChatAttachment[];
  memories?: IMemoryBrief[];
  skill?: string | null;
  doubts?: IPlanDoubt[];
}

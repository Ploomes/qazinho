import type { IAgentContext } from './IAgentContext';
import type { IIssue } from './IIssue';
import type { ILiveRun } from './ILiveRun';
import type { WorkspaceStatus } from './WorkspaceStatus';
import type { IBug } from '@/modules/Bug';
import type { ChatMessage } from '@/modules/Chat';
import type { ViewportId } from '@/modules/Device';
import type { IPublishedPlan, ITestCase } from '@/modules/Plan';
import type { IRun } from '@/modules/Run';
import type {
  ICodeSource,
  IConfluencePageRef,
  IDesignLink,
  IUnreadPlan,
} from '@/shared/types';

/**
 * One front of testing in a project: its chat, device, plan, runs and where its plan came
 * from.
 */
export interface IWorkspace {
  id: string;
  projectId: string;
  name: string;
  targetId: string;
  planKind: 'web' | 'mobile';
  viewportId: ViewportId;
  sessionId: string | null;
  sessionAgentId: string | null;
  context: IAgentContext | null;
  status: WorkspaceStatus;
  issue: IIssue | null;
  design: IDesignLink | null;
  chat: ChatMessage[];
  plan: ITestCase[];
  unreadPlan: IUnreadPlan | null;
  plainValues: string[];
  planSource: ICodeSource | null;
  sourcePage: IConfluencePageRef | null;
  published: IPublishedPlan | null;
  runs: IRun[];
  bugs: IBug[];
  live: ILiveRun | null;
  hasBeenAsked: boolean;
}

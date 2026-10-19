import type { IAgentContext } from './IAgentContext';
import type { IIssue } from './IIssue';
import type { ILiveRun } from './ILiveRun';
import type { WorkspaceStatus } from './WorkspaceStatus';
import type { IBug } from '@/modules/Bug';
import type { ChatMessage } from '@/modules/Chat';
import type { ViewportId } from '@/modules/Device';
import type { ITestCase } from '@/modules/Plan';
import type { IRun } from '@/modules/Run';

/** One front of testing inside a project: its own chat, device, plan and runs. */
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
  chat: ChatMessage[];
  plan: ITestCase[];
  runs: IRun[];
  bugs: IBug[];
  live: ILiveRun | null;
  hasBeenAsked: boolean;
}

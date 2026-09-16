import type { IBug } from '@/modules/Bug/types';
import type { ChatMessage } from '@/modules/Chat/types';
import type { ITestCase } from '@/modules/Plan/types';
import type { IRun } from '@/modules/Run/types';
import type { IIssue } from './IIssue';
import type { ILiveRun } from './ILiveRun';
import type { WorkspaceStatus } from './WorkspaceStatus';

/** One front of testing inside a project: its own chat, device, plan and runs. */
export interface IWorkspace {
  id: string;
  projectId: string;
  name: string;
  targetId: string;
  status: WorkspaceStatus;
  issue: IIssue | null;
  chat: ChatMessage[];
  plan: ITestCase[];
  runs: IRun[];
  bugs: IBug[];
  live: ILiveRun | null;
  hasBeenAsked: boolean;
}

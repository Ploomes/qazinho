import type { IAgentContext } from './IAgentContext';
import type { IIssue } from './IIssue';
import type { ILiveRun } from './ILiveRun';
import type { StoryStage } from './StoryStage';
import type { WorkspaceStatus } from './WorkspaceStatus';
import type { IBug } from '@/modules/Bug';
import type { ChatMessage } from '@/modules/Chat';
import type { ViewportId } from '@/modules/Device';
import type {
  IChangeReview,
  IPendingChange,
  IPublishedPlan,
  ITestCase,
} from '@/modules/Plan';
import type { IRun } from '@/modules/Run';
import type {
  ICodeSource,
  IConfluencePageRef,
  IDesignLink,
  IPlanDoubt,
  IPlanStrategy,
  ISourceSnapshot,
  IUnreadPlan,
} from '@/shared/types';

/**
 * Uma frente de teste num projeto: o chat, o dispositivo, o plano com a estratégia e as
 * dúvidas dele, as runs e de onde veio o plano.
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
  strategy?: IPlanStrategy | null;
  doubts?: IPlanDoubt[];
  storyStage?: StoryStage;
  snapshots?: ISourceSnapshot[];
  changed?: IPendingChange;
  review?: IChangeReview;
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

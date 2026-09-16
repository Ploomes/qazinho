import type { StepVerdict } from '@/modules/Run/types';
import type { WorkspaceStatus } from '@/modules/Workspace/types';

export type PillStatus = WorkspaceStatus | StepVerdict;

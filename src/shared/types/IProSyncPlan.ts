import type { IDesignLink } from './IDesignLink';
import type { IProSyncCase } from './IProSyncCase';
import type { TargetKind } from './TargetKind';

/**
 * A workspace's plan as it goes to QAzinho Pro: its name, the target it runs on, where it
 * came from, and its cases.
 */
export interface IProSyncPlan {
  workspaceId: string;
  name: string;
  targetId: string;
  targetKind: TargetKind;
  issue: { key: string; title: string; source: string; url: string } | null;
  design: IDesignLink | null;
  cases: IProSyncCase[];
}

import type { TargetKind } from './TargetKind';

/**
 * A project as it goes to QAzinho Pro: its name, its targets and its repositories; its
 * variables go by name from main.
 */
export interface IProSyncProject {
  projectId: string;
  name: string;
  targets: { id: string; kind: TargetKind; label: string; value: string }[];
  repositories: { id: string; owner: string; name: string; baseBranch: string }[];
}

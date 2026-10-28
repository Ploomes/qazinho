import type { TargetKind } from './TargetKind';

/**
 * Um projeto como vai ao QAzinho Pro: o nome, os alvos e os repositórios; as variáveis
 * vão pelo nome a partir da main.
 */
export interface IProSyncProject {
  projectId: string;
  name: string;
  targets: { id: string; kind: TargetKind; label: string; value: string }[];
  repositories: { id: string; owner: string; name: string; baseBranch: string }[];
}

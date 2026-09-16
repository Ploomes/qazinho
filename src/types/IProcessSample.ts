import type { ProcessKind } from './ProcessKind';

/** One process gocrash is responsible for, as the host reported it. */
export interface IProcessSample {
  pid: number;
  name: string;
  kind: ProcessKind;
  workspaceId: string | null;
  cpu: number;
  ramMb: number;
}

import type { ProcessKind } from './ProcessKind';

/** Um processo pelo qual o QAzinho responde, como o host o relatou. */
export interface IProcessSample {
  pid: number;
  name: string;
  kind: ProcessKind;
  workspaceId: string | null;
  cpu: number;
  ramMb: number;
}

import type { IProcessRow } from '@/main/types';
import type { IProcessSample, ProcessKind } from '@/types';
import { basename } from 'node:path';

export function toSample(props: {
  row: IProcessRow;
  cpu: number;
  kind: ProcessKind;
  workspaceId: string | null;
}): IProcessSample {
  const { row, cpu, kind, workspaceId } = props;

  return {
    pid: row.pid,
    name: basename(row.name),
    kind,
    workspaceId,
    cpu: Math.round(cpu * 10) / 10,
    ramMb: Math.round(row.ramMb),
  };
}

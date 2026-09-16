import type { IProcessRow } from '@/main/types';
import type { IProcessSample } from '@/types';
import { basename } from 'node:path';

export function toSample(row: IProcessRow): IProcessSample {
  return {
    pid: row.pid,
    name: basename(row.name),
    cpu: Math.round(row.cpu * 10) / 10,
    ramMb: Math.round(row.ramMb),
  };
}

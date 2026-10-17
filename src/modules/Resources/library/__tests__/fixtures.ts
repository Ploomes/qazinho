import type { IProcessSample, ProcessKind } from '@/shared/types';

export function sample(props: {
  name: string;
  kind: ProcessKind;
  workspaceId?: string;
  ramMb?: number;
}): IProcessSample {
  return {
    pid: props.name.length * 7,
    name: props.name,
    kind: props.kind,
    workspaceId: props.workspaceId ?? null,
    cpu: 4,
    ramMb: props.ramMb ?? 512,
  };
}

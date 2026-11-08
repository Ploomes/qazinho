import type { IProSyncRecord } from '@/main/classes/pro/ProSync/types';
import type { IMemory } from '@/shared/types';
import { memoriesHashOf } from './memoriesHashOf';

/** Se esta lista difere da última que os dois lados viram; nenhuma nunca é nada novo. */
export function hasNewMemories(props: {
  record: IProSyncRecord;
  memories: IMemory[];
}): boolean {
  const { record, memories } = props;

  return (
    (memories.length > 0 || record.memories !== null) &&
    memoriesHashOf(memories) !== record.memories
  );
}

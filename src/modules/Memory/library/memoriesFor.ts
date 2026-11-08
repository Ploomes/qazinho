import type { IMemory, IMemoryBrief, TargetKind } from '@/shared/types';
import { MEMORY } from '@/modules/Memory/constants';

/**
 * O que o agente lê num workspace: as memórias do projeto e as do plano dele, as mais
 * recentes; com um alvo, só as que valem nele, e sem alvo, todas.
 */
export function memoriesFor(props: {
  memories: IMemory[] | undefined;
  workspaceId: string;
  targetKind?: TargetKind;
}): IMemoryBrief[] {
  const { workspaceId, targetKind } = props;

  return (props.memories ?? [])
    .filter(
      ({ deletedAt, scope, workspaceId: owner, target }) =>
        deletedAt === null &&
        (scope === 'project' || owner === workspaceId) &&
        (targetKind === undefined || target === 'all' || target === targetKind),
    )
    .slice(-MEMORY.shown)
    .map(({ id, text, scope, target }) => ({ id, text, scope, target }));
}

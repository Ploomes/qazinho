import type { IMemory } from '@/shared/types';
import { hashOf } from './hashOf';

/** Uma impressão digital das memórias ativas de um projeto, em qualquer ordem. */
export function memoriesHashOf(memories: IMemory[]): string {
  return hashOf(
    memories
      .filter(({ deletedAt }) => deletedAt === null)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, text, scope, workspaceId, target, updatedAt, deletedAt }) => [
        id,
        text,
        scope,
        workspaceId,
        target,
        updatedAt,
        deletedAt,
      ]),
  );
}

import type { IMemory } from '@/shared/types';
import { hashOf } from './hashOf';

/** Uma impressão digital das memórias de um projeto, seja qual for a ordem delas. */
export function memoriesHashOf(memories: IMemory[]): string {
  return hashOf(
    [...memories]
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

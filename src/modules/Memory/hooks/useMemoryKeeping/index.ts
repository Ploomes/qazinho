import { useEffect, useEffectEvent } from 'react';
import { memoriesFor, newMemoryId, withMemoryOps } from '@/modules/Memory/library';
import { Memories } from '@/services';
import {
  useAppStore,
  useMachineStore,
  useMemoryStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

export const useMemoryKeeping = () => {
  const waiting = useMemoryStore((state) => state.waiting);
  const isKeeping = useMemoryStore((state) => state.isKeeping);

  const projectOf = (projectId: string) =>
    useAppStore.getState().projects.find(({ id }) => id === projectId) ?? null;

  const keepNext = useEffectEvent(() => {
    const { take, finish } = useMemoryStore.getState();
    const request = take();

    if (request === null) return;

    const { projectId, workspaceId, events } = request;
    const project = projectOf(projectId);

    if (project === null) {
      finish();

      return;
    }

    const { agent, model, language } = useSettingsStore.getState();
    const agentId =
      useMachineStore.getState().agents.find(({ name }) => name === agent)?.id ??
      'claude-code';

    void Memories.keep({
      projectId,
      agentId,
      model,
      language,
      memories: memoriesFor({ memories: project.memories, workspaceId }),
      events,
    })
      .then((kept) => {
        const now = projectOf(projectId);

        if (!kept.isKept || kept.ops.length === 0 || now === null) return;

        const { memories, changes } = withMemoryOps({
          memories: now.memories ?? [],
          ops: kept.ops,
          workspaceId,
          now: new Date().toISOString(),
          newId: newMemoryId,
        });

        if (changes.length === 0) return;

        useAppStore.getState().updateProject({ ...now, memories });
        useWorkspaceStore.getState().landMemoryChanges({ workspaceId, changes });
      })
      .catch(() => undefined)
      .finally(finish);
  });

  useEffect(() => {
    if (waiting.length > 0 && !isKeeping) keepNext();
  }, [waiting, isKeeping]);
};

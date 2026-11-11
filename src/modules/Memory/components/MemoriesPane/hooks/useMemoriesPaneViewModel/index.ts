import type { IMemoriesPaneProps } from '@/modules/Memory/components/MemoriesPane/types';
import { useTranslation } from 'react-i18next';
import { memoryRowsOf, withMemoryOps } from '@/modules/Memory/library';
import { TARGET_NAME_KEYS } from '@/modules/Project/components/ProjectModal/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useMemoriesPaneViewModel = ({ projectId }: IMemoriesPaneProps) => {
  const { t } = useTranslation();
  const project = useAppStore(
    (state) => state.projects.find(({ id }) => id === projectId) ?? null,
  );
  const updateProject = useAppStore((state) => state.updateProject);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const memories = project?.memories ?? [];

  const onForget = (id: string) => {
    if (project === null) return;

    updateProject({
      ...project,
      memories: withMemoryOps({
        memories,
        ops: [{ op: 'delete', id }],
        workspaceId: '',
        now: new Date().toISOString(),
        newId: () => '',
      }).memories,
    });
  };

  const rows = memoryRowsOf({ memories, workspaces }).map(({ memory, planName }) => ({
    id: memory.id,
    text: memory.text,
    where: [planName, memory.target === 'all' ? null : t(TARGET_NAME_KEYS[memory.target])]
      .filter((part) => part !== null)
      .join(', '),
    onForget: () => {
      onForget(memory.id);
    },
  }));

  return {
    rows,
    hasRows: rows.length > 0,
    lead: t(rows.length > 0 ? 'PROJECT.MEMORIES_LEAD' : 'PROJECT.MEMORIES_EMPTY'),
    forgetLabel: t('PROJECT.MEMORY_FORGET'),
  };
};

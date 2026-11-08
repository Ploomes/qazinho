import type { IMemory } from '@/shared/types';

/**
 * As memórias que a janela do projeto lista, da mais nova à mais velha, com o nome do
 * plano de cada uma; a de um plano que não existe mais fica de fora.
 */
export function memoryRowsOf(props: {
  memories: IMemory[];
  workspaces: { id: string; name: string }[];
}): { memory: IMemory; planName: string | null }[] {
  const { memories, workspaces } = props;

  return memories
    .filter(({ deletedAt }) => deletedAt === null)
    .flatMap((memory): { memory: IMemory; planName: string | null }[] => {
      if (memory.scope === 'project') return [{ memory, planName: null }];

      const plan = workspaces.find(({ id }) => id === memory.workspaceId);

      return plan === undefined ? [] : [{ memory, planName: plan.name }];
    })
    .reverse();
}

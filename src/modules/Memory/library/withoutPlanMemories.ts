import type { IMemory } from '@/shared/types';

/** As memórias sem as de um plano que foi embora; a mesma lista se não há nenhuma. */
export function withoutPlanMemories(props: {
  memories: IMemory[];
  workspaceId: string;
  now: string;
}): IMemory[] {
  const { memories, workspaceId, now } = props;
  const isOfPlan = (one: IMemory) =>
    one.scope === 'plan' && one.workspaceId === workspaceId && one.deletedAt === null;

  return memories.some(isOfPlan)
    ? memories.map((one) =>
        isOfPlan(one) ? { ...one, text: '', updatedAt: now, deletedAt: now } : one,
      )
    : memories;
}

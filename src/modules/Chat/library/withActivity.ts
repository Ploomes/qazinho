import type { IAgentActivity } from '@/modules/Chat/types';
import { ACTIVITY_KEYS, AGENT_ACTIVITY } from '@/modules/Chat/constants';

/**
 * As últimas coisas que o agente fez depois de mais uma: o que a tela não sabe dizer fica
 * de fora, e a mesma coisa duas vezes é uma linha só.
 */
export function withActivity(props: {
  activities: IAgentActivity[];
  tool: string;
  target: string;
}): IAgentActivity[] {
  const { activities, tool, target } = props;
  const last = activities.at(-1);

  if (!Object.hasOwn(ACTIVITY_KEYS, tool)) return activities;

  if (last?.tool === tool && last.target === target) return activities;

  return [...activities, { id: (last?.id ?? 0) + 1, tool, target }].slice(
    -AGENT_ACTIVITY.kept,
  );
}

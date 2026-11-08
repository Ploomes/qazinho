import type { IAgentActivity } from '@/modules/Chat/types';
import { ACTIVITY_KEYS, AGENT_ACTIVITY } from '@/modules/Chat/constants';

/**
 * As últimas coisas que o agente fez depois de mais uma: o que a tela não sabe dizer fica
 * de fora, e o motivo que ele deu fica até o passo acabar ou ele dar outro.
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

  const next = [...activities, { id: (last?.id ?? 0) + 1, tool, target }];
  const said =
    tool === 'report' ? [] : next.filter((one) => one.tool === 'say').slice(-1);

  return [
    ...said,
    ...next.filter((one) => one.tool !== 'say').slice(-AGENT_ACTIVITY.kept),
  ].sort((one, other) => one.id - other.id);
}

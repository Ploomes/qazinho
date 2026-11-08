import type { ActivityKey, IActivityLine, IAgentActivity } from '@/modules/Chat/types';
import { ACTIVITY_KEYS } from '@/modules/Chat/constants';

/**
 * O que o agente fez como o QA lê: um arquivo pelo nome, e uma medida como a comparação
 * com o design quando o workspace tem um.
 */
export function activityLineOf(props: {
  activity: IAgentActivity;
  hasDesign: boolean;
  say: (key: ActivityKey, values: { target: string }) => string;
}): IActivityLine | null {
  const { activity, hasDesign, say } = props;
  const key = keyOf({ tool: activity.tool, hasDesign });

  return key === null
    ? null
    : {
        id: activity.id,
        text: say(key, { target: targetOf(activity) }),
        isBug: activity.tool === 'bug',
        isSay: activity.tool === 'say',
      };
}

function keyOf(props: { tool: string; hasDesign: boolean }): ActivityKey | null {
  if (props.tool === 'inspect' && props.hasDesign) return 'CHAT.DOING_INSPECT_DESIGN';

  return Object.hasOwn(ACTIVITY_KEYS, props.tool)
    ? ACTIVITY_KEYS[props.tool as keyof typeof ACTIVITY_KEYS]
    : null;
}

function targetOf(activity: IAgentActivity): string {
  if (activity.tool === 'Read') return activity.target.split(/[\\/]/).at(-1) ?? '';

  return activity.tool === 'goto'
    ? activity.target.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : activity.target;
}

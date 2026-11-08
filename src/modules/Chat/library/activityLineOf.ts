import type { ActivityKey, IActivityLine, IAgentActivity } from '@/modules/Chat/types';
import { ACTIVITY_KEYS, TAB_ACTIVITY_KEYS } from '@/modules/Chat/constants';

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
  const key = keyOf({ tool: activity.tool, target: activity.target, hasDesign });

  return key === null
    ? null
    : {
        id: activity.id,
        text: say(key, { target: targetOf(activity) }),
        isBug: activity.tool === 'bug',
        isSay: activity.tool === 'say',
      };
}

function keyOf(props: {
  tool: string;
  target: string;
  hasDesign: boolean;
}): ActivityKey | null {
  if (props.tool === 'inspect' && props.hasDesign) return 'CHAT.DOING_INSPECT_DESIGN';

  if (props.tool === 'tab' && Object.hasOwn(TAB_ACTIVITY_KEYS, props.target))
    return TAB_ACTIVITY_KEYS[props.target as keyof typeof TAB_ACTIVITY_KEYS];

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

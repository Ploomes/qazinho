import type { IScreenNode } from '@/main/classes/devices/AndroidDriver/types';
import { ANDROID } from '@/main/classes/devices/AndroidDriver/constants';

function labelOf(node: IScreenNode): string {
  const label = node.text.length > 0 ? node.text : node.desc;

  return `${node.role.toLowerCase()}: ${(label.length > 0 ? label : node.id).slice(0, ANDROID.labelLimit)}`;
}

/** What the agent is allowed to look at: what a person would read on the screen. */
export function describeScreen(props: { nodes: IScreenNode[]; app: string }): string {
  const readable = props.nodes.filter(
    (node) => node.text.length > 0 || node.desc.length > 0 || node.isEditable,
  );

  const text = readable
    .filter((node) => node.text.length > 0)
    .map((node) => node.text)
    .join('\n')
    .slice(0, ANDROID.screenTextLimit);

  const controls = readable
    .filter((node) => node.isClickable || node.isEditable || node.desc.length > 0)
    .slice(0, ANDROID.controlLimit)
    .map(labelOf);

  return [`APP: ${props.app}`, 'TEXT:', text, 'CONTROLS:', ...controls].join('\n');
}

import type { IScreenNode } from '@/main/classes/devices/AndroidDriver/types';
import { ordinalOf, withoutRole } from '@/main/library';

function says(node: IScreenNode): string[] {
  return [node.text, node.desc, node.id].filter((one) => one.length > 0);
}

function find(props: { nodes: IScreenNode[]; target: string }): IScreenNode | null {
  const { name, nth } = ordinalOf(props.target);
  const wanted = name.toLowerCase();

  if (wanted.length === 0) return null;

  const exact = props.nodes.filter((node) =>
    says(node).some((one) => one.toLowerCase() === wanted),
  );
  const partial = props.nodes.filter((node) =>
    says(node).some((one) => one.toLowerCase().includes(wanted)),
  );

  return exact[nth] ?? partial[nth] ?? null;
}

/** The agent names what a person would read, the label before the id, "#2" for the second of several, and a control copied as look lists it. */
export function findNode(props: {
  nodes: IScreenNode[];
  target: string;
}): IScreenNode | null {
  const listed = withoutRole(props.target);

  return find(props) ?? (listed === null ? null : find({ ...props, target: listed }));
}

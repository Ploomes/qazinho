import type { IScreenNode } from '@/main/classes/devices/AndroidDriver/types';

function says(node: IScreenNode): string[] {
  return [node.text, node.desc, node.id].filter((one) => one.length > 0);
}

/** The agent names what a person would read, so the label is matched before the id. */
export function findNode(props: {
  nodes: IScreenNode[];
  target: string;
}): IScreenNode | null {
  const wanted = props.target.trim().toLowerCase();

  if (wanted.length === 0) return null;

  const exact = props.nodes.find((node) =>
    says(node).some((one) => one.toLowerCase() === wanted),
  );

  return (
    exact ??
    props.nodes.find((node) =>
      says(node).some((one) => one.toLowerCase().includes(wanted)),
    ) ??
    null
  );
}

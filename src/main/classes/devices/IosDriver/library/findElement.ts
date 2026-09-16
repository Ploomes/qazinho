import type { IScreenElement } from '@/main/classes/devices/IosDriver/types';

/** The agent names what a person would read, so the label is what is matched. */
export function findElement(props: {
  elements: IScreenElement[];
  target: string;
}): IScreenElement | null {
  const wanted = props.target.trim().toLowerCase();

  if (wanted.length === 0) return null;

  const labelled = props.elements.filter((one) => one.label.length > 0);

  return (
    labelled.find((one) => one.label.toLowerCase() === wanted) ??
    labelled.find((one) => one.label.toLowerCase().includes(wanted)) ??
    null
  );
}

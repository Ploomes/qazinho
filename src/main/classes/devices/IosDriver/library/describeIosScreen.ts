import type { IScreenElement } from '@/main/classes/devices/IosDriver/types';
import { IOS } from '@/main/classes/devices/IosDriver/constants';
import { numberDuplicates } from '@/main/library';

/** What the agent is allowed to look at: what a person would read on the screen. */
export function describeIosScreen(props: {
  elements: IScreenElement[];
  app: string;
}): string {
  const labelled = props.elements.filter((one) => one.label.length > 0);

  const text = labelled
    .map((one) => one.label)
    .join('\n')
    .slice(0, IOS.screenTextLimit);

  const controls = labelled
    .slice(0, IOS.controlLimit)
    .map((one) => `${one.role.toLowerCase()}: ${one.label.slice(0, IOS.labelLimit)}`);

  return [
    `APP: ${props.app}`,
    'TEXT:',
    text,
    'CONTROLS:',
    ...numberDuplicates(controls),
  ].join('\n');
}

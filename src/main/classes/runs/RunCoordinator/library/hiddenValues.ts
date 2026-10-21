import type { IVariableValue } from '@/main/types';
import { RUN_WALK } from '@/main/classes/runs/RunCoordinator/constants';

/** The text with each variable's value that shows in it read back as its ${NAME}, the longest first; a value too short to tell from an ordinary word stays. */
export function hiddenValues(props: { text: string; values: IVariableValue[] }): string {
  return props.values
    .filter(({ value }) => value.length >= RUN_WALK.hiddenFromLength)
    .sort((one, other) => other.value.length - one.value.length)
    .reduce((text, { name, value }) => text.split(value).join(`\${${name}}`), props.text);
}

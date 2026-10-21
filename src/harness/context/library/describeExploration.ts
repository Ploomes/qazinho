import type { IVariableBrief } from '@/shared/types';
import { describeVariables } from './describeVariables';

/** The message that starts an exploration: how long it goes, the variables it may type, and the screen it starts on. */
export function describeExploration(props: {
  minutes: number;
  screen: string;
  variables: IVariableBrief[];
}): string {
  const { minutes, screen, variables } = props;

  return [
    `Explore the app for ${String(minutes)} minutes: note each screen the first time you reach it, file what is wrong, and call finish before the time is up.`,
    ...describeVariables(variables),
    ...(screen.length === 0 ? [] : ['', 'The device shows right now:', screen]),
  ].join('\n');
}

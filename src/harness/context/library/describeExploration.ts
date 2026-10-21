import type { IKnownBug, IVariableBrief } from '@/shared/types';
import { describeKnownBugs } from './describeKnownBugs';
import { describeVariables } from './describeVariables';

/** The message that starts an exploration: how long it goes, the variables it may type, the bugs already open, and the screen it starts on. */
export function describeExploration(props: {
  minutes: number;
  screen: string;
  variables: IVariableBrief[];
  known: IKnownBug[];
}): string {
  const { minutes, screen, variables, known } = props;

  return [
    `Explore the app for ${String(minutes)} minutes: note each screen the first time you reach it, file what is wrong, and call finish before the time is up.`,
    ...describeVariables(variables),
    ...describeKnownBugs(known),
    ...(screen.length === 0 ? [] : ['', 'The device shows right now:', screen]),
  ].join('\n');
}

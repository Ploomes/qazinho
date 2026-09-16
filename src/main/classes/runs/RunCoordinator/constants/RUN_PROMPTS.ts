import type { TargetKind } from '@/types';
import { DEVICE_BRIEF } from './DEVICE_BRIEF';

/** The agent drives the device, but the requirement is what judges the step. */
export const RUN_PROMPTS = {
  act: (props: {
    action: string;
    target: { kind: TargetKind; value: string };
    screen: string;
  }): string =>
    [
      DEVICE_BRIEF[props.target.kind],
      `The device is on ${props.target.value}. What it shows right now:`,
      props.screen,
      `The step to carry out: ${props.action}`,
      'Answer with the actions that carry out this step and nothing more.',
    ].join('\n'),

  judge: (props: { action: string; expected: string; screen: string }): string =>
    [
      'You are judging one step of a QA test.',
      `The step was: ${props.action}`,
      `The QA expected: ${props.expected}`,
      'What the device shows after the step:',
      props.screen,
      'Judge only against what the QA expected. Answer passed, failed, or blocked when the',
      'step could not be carried out at all. Say what you actually saw in "got".',
      'When it failed, also give "title": one line a developer would recognise the bug by,',
      'and "severity": high, medium or low.',
    ].join('\n'),
};

import type { TargetKind } from '@/types';
import { DEVICE_BRIEF } from './DEVICE_BRIEF';

/** The agent drives the device, but the requirement is what judges the step. */
export const RUN_PROMPTS = {
  act: (props: {
    action: string;
    target: { kind: TargetKind; value: string };
    screen: string;
    failure: string | null;
  }): string =>
    [
      DEVICE_BRIEF[props.target.kind],
      `The device is on ${props.target.value}. What it shows right now:`,
      props.screen,
      `The step to carry out: ${props.action}`,
      ...(props.failure === null
        ? []
        : [
            `Your last try at this step did not work: ${props.failure}`,
            'Find another way to reach the same goal: another label for the same control, a',
            'banner or dialog to close first, a wait for the page to settle. Do not repeat what failed.',
          ]),
      'Answer with the actions that carry out this step and nothing more.',
      'When something got in the way and you worked around it, say so in "note", in one',
      'sentence the QA reads in the chat. Leave "note" empty when the step went as planned.',
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

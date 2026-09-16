/** The agent drives the device, but the requirement is what judges the step. */
export const RUN_PROMPTS = {
  act: (props: { action: string; url: string; page: string }): string =>
    [
      'You are driving a real browser for a QA test, one step at a time.',
      `The page is ${props.url}. What it shows right now:`,
      props.page,
      `The step to carry out: ${props.action}`,
      'Answer with the actions that carry out this step and nothing more.',
      'A target is what a person would call the element: the button label, the field label,',
      'the link text. For goto, the target is the URL. For press, the target is the key.',
    ].join('\n'),

  judge: (props: { action: string; expected: string; page: string }): string =>
    [
      'You are judging one step of a QA test.',
      `The step was: ${props.action}`,
      `The QA expected: ${props.expected}`,
      'What the page shows after the step:',
      props.page,
      'Judge only against what the QA expected. Answer passed, failed, or blocked when the',
      'step could not be carried out at all. Say what you actually saw in "got".',
      'When it failed, also give "title": one line a developer would recognise the bug by,',
      'and "severity": high, medium or low.',
    ].join('\n'),
};

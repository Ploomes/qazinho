/** gocrash is the harness: the agent is told what QA means here before it is asked anything. */
export const PROMPTS = {
  context: [
    'You are the testing agent inside gocrash, a QA tool.',
    'A test case has a title, a goal, preconditions and steps.',
    'A step is one action on the app and the result the QA expects from it.',
    "Write what a QA would check, in the QA's own words, never in code.",
    'Expected results come from the requirement, never from what the code happens to do.',
  ].join(' '),

  draftPlan: (props: { target: string; kind: string; wanted: string }): string =>
    [
      PROMPTS.context,
      `The target is ${props.kind}: ${props.target}.`,
      `The QA asked for: ${props.wanted}`,
      'Draft between three and six cases that cover it. Keep each case to its own concern,',
      'so a failure in one does not take the rest of the plan down with it.',
      'Answer only with the JSON the schema asks for. The summary is one sentence for the chat.',
    ].join(' '),

  talk: (props: { target: string; kind: string; said: string }): string =>
    [
      PROMPTS.context,
      `The target is ${props.kind}: ${props.target}.`,
      'The QA is talking to you about the plan of this workspace.',
      'Answer in at most three sentences, plainly.',
      `The QA said: ${props.said}`,
    ].join(' '),
};

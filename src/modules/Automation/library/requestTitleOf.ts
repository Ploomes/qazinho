import type { SuiteChangeAsk } from '@/modules/Automation/types';

const LONGEST = 72;

/** What a change is about in a line: the test that broke, or the test asked for, by its plan case or the QA's first words. */
export function requestTitleOf(ask: SuiteChangeAsk): string {
  if (ask.kind === 'fix') return ask.test.title;

  const [first = ''] = (ask.source?.title ?? ask.text).trim().split('\n');

  return first.length > LONGEST ? `${first.slice(0, LONGEST - 1).trimEnd()}…` : first;
}

import type { SuiteChangeAsk } from '@/shared/types';

const LONGEST = 72;

/** What a change is about in a line: the test that broke, or the test to write, by its plan case or the QA's first words. */
export function askTitleOf(ask: SuiteChangeAsk): string {
  if (ask.kind === 'fix') return ask.test.title;

  const [first = ''] = (ask.source?.title ?? ask.text).trim().split('\n');

  return first.length > LONGEST ? `${first.slice(0, LONGEST - 1).trimEnd()}…` : first;
}

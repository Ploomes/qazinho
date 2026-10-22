import type { IBugUpdateWords } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { updateReportOf } from '@/modules/Bug/library';

const WORDS: IBugUpdateWords = {
  regression: 'Back after the issue was closed.',
  seenAgain: 'Seen again in:',
  runLine: ({ run, when, caseId, step }) =>
    `${run} at ${when} · ${caseId}, step ${String(step)}`,
  attached: (files) => `Attached: ${files.join(', ')}.`,
};
const SIGHTING = {
  runId: 'r-05',
  runWhen: '14:02',
  caseId: 'TC-02',
  stepNumber: 2,
  at: 1,
  shot: { isBad: true, src: null, file: '/r.jpg' },
};

describe('updateReportOf', () => {
  it('writes the update: the regression first, the QA’s words, the runs and what is attached', () => {
    expect(
      updateReportOf({
        verdict: 'regression',
        comment: 'Taken on mobile too.',
        sightings: [SIGHTING],
        attached: ['the screen in r-05'],
        words: WORDS,
      }).blocks,
    ).toEqual([
      { kind: 'paragraph', text: 'Back after the issue was closed.' },
      { kind: 'paragraph', text: 'Taken on mobile too.' },
      { kind: 'paragraph', text: 'Seen again in:' },
      { kind: 'list', items: ['r-05 at 14:02 · TC-02, step 2'] },
      { kind: 'paragraph', text: 'Attached: the screen in r-05.' },
    ]);
  });

  it('says nothing of a regression for news, nor of files when none go', () => {
    expect(
      updateReportOf({
        verdict: 'news',
        comment: 'Taken on mobile too.',
        sightings: [],
        attached: [],
        words: WORDS,
      }).blocks,
    ).toEqual([{ kind: 'paragraph', text: 'Taken on mobile too.' }]);
  });
});

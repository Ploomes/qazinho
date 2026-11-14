import type { IFlatStep } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { markedOutcomeOf } from '@/main/classes/runs/RunCoordinator/library';

const STEP: IFlatStep = {
  caseId: 'TC-07',
  caseTitle: 'The invoice PDF reads well',
  casePriority: 'P2',
  caseGoal: '',
  casePreconditions: 'On order 1042',
  numberInCase: 2,
  action: 'Open the PDF of the invoice',
  expected: 'The logo and the tax id read well',
  caseIsManual: true,
};

const marked = (props: { verdict: 'passed' | 'failed' | 'skipped'; note: string }) =>
  markedOutcomeOf({
    step: STEP,
    index: 5,
    workspaceId: 'w-1',
    ...props,
    tookMs: 4_000,
    at: 1_000,
    shot: { file: '/runs/r-01/step-6.jpg', dataUrl: 'data:image/jpeg;base64,' },
  });

describe('markedOutcomeOf', () => {
  it('keeps a step the QA passed with its screen, as walked by the QA', () => {
    expect(marked({ verdict: 'passed', note: '' })).toMatchObject({
      caseId: 'TC-07',
      stepNumber: 2,
      index: 5,
      verdict: 'passed',
      got: '',
      title: '',
      by: 'qa',
      shotFile: '/runs/r-01/step-6.jpg',
    });
  });

  it('files a failure with the note as what came, its first line as the title', () => {
    expect(
      marked({ verdict: 'failed', note: 'The tax id is cut in half\nOn page 2 too' }),
    ).toMatchObject({
      verdict: 'failed',
      why: 'The tax id is cut in half\nOn page 2 too',
      got: 'The tax id is cut in half\nOn page 2 too',
      title: 'The tax id is cut in half',
    });
  });

  it('names a failure with no note after its step, and keeps a long title short', () => {
    expect(marked({ verdict: 'failed', note: '' }).title).toBe(
      'Open the PDF of the invoice',
    );
    expect(marked({ verdict: 'failed', note: 'x'.repeat(200) }).title).toHaveLength(90);
  });
});

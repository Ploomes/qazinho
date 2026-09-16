import { describe, expect, it } from 'vitest';
import { parseVerdict } from '@/main/classes/runs/RunCoordinator/library';

describe('parseVerdict', () => {
  it('reads the judgement and what was actually seen', () => {
    const answer = JSON.stringify({
      verdict: 'failed',
      why: 'No inline error appeared.',
      got: 'The payment step opened with the field empty.',
    });

    expect(parseVerdict(answer)).toMatchObject({
      verdict: 'failed',
      why: 'No inline error appeared.',
      got: 'The payment step opened with the field empty.',
    });
  });

  it('does NOT read an unjudged step as a pass', () => {
    expect(parseVerdict('the page looked fine').verdict).toBe('blocked');
  });

  it('refuses a verdict gocrash does not have', () => {
    const answer = JSON.stringify({ verdict: 'probably fine', why: '', got: '' });

    expect(parseVerdict(answer).verdict).toBe('blocked');
  });
});

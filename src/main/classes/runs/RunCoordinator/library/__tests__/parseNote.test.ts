import { describe, expect, it } from 'vitest';
import { parseNote } from '@/main/classes/runs/RunCoordinator/library';

describe('parseNote', () => {
  it('reads what the agent worked around', () => {
    const answer = JSON.stringify({
      actions: [],
      note: ' Closed the cookie banner first. ',
    });

    expect(parseNote(answer)).toBe('Closed the cookie banner first.');
  });

  it('says nothing when the agent left no note', () => {
    expect(parseNote(JSON.stringify({ actions: [] }))).toBe('');
  });

  it('says nothing for an answer that is not json', () => {
    expect(parseNote('API Error: 400')).toBe('');
  });
});

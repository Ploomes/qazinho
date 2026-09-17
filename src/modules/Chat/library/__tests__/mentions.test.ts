import { describe, expect, it } from 'vitest';
import {
  insertMention,
  mentionQueryOf,
  mentionsIn,
  splitMentions,
} from '@/modules/Chat/library';

const RUN = { kind: 'run' as const, id: 'r-02', title: 'The whole plan', facts: [] };
const BUG = { kind: 'bug' as const, id: 'BUG-01', title: 'Cart empties', facts: [] };

describe('mentionQueryOf', () => {
  it('reads what is being typed after an @ at the end', () => {
    expect(mentionQueryOf('what happened in @r-0')).toBe('r-0');
    expect(mentionQueryOf('@')).toBe('');
  });

  it('does NOT open on an @ inside a word, like an email', () => {
    expect(mentionQueryOf('mail qa@shop')).toBeNull();
  });

  it('closes once the mention is followed by a space', () => {
    expect(mentionQueryOf('explain @r-02 ')).toBeNull();
  });
});

describe('insertMention', () => {
  it('completes the @ being typed with the picked id and a space', () => {
    expect(insertMention({ draft: 'explain @r', id: 'r-02' })).toBe('explain @r-02 ');
  });
});

describe('mentionsIn', () => {
  it('keeps the references the text still mentions, once each', () => {
    expect(
      mentionsIn({
        text: 'compare @r-02 with @r-02 and @BUG-01',
        references: [RUN, BUG, RUN],
      }),
    ).toEqual([RUN, BUG]);
  });

  it('drops a reference whose mention was deleted from the text', () => {
    expect(mentionsIn({ text: 'never mind', references: [RUN] })).toEqual([]);
  });
});

describe('splitMentions', () => {
  it('marks the mentions in a message so they stand out', () => {
    expect(splitMentions({ text: 'why did @r-02 block?', ids: ['r-02'] })).toEqual([
      { text: 'why did ', isMention: false },
      { text: '@r-02', isMention: true },
      { text: ' block?', isMention: false },
    ]);
  });

  it('does NOT mark an id that only starts the same', () => {
    expect(splitMentions({ text: '@r-021', ids: ['r-02'] })).toEqual([
      { text: '@r-021', isMention: false },
    ]);
  });
});

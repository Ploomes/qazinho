import { describe, expect, it } from 'vitest';
import { blocksOfComment } from '@/modules/Bug/library';

describe('blocksOfComment', () => {
  it('reads paragraphs split by a blank line, and dashed lines as a list', () => {
    expect(
      blocksOfComment(
        'It also breaks on mobile.\nAt 390 × 844.\n\n- r-05: taken\n* r-06: taken\n\n\nAnswering Bia: yes.',
      ),
    ).toEqual([
      { kind: 'paragraph', text: 'It also breaks on mobile.\nAt 390 × 844.' },
      { kind: 'list', items: ['r-05: taken', 'r-06: taken'] },
      { kind: 'paragraph', text: 'Answering Bia: yes.' },
    ]);
  });

  it('reads nothing out of blank text', () => {
    expect(blocksOfComment(' \n\n ')).toEqual([]);
  });
});

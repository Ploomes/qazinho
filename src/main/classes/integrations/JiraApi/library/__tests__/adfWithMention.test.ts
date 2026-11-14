import { describe, expect, it } from 'vitest';
import { adfOfNote, adfWithMention } from '@/main/classes/integrations/JiraApi/library';

const MARINA = { id: 'po-marina', name: 'Marina' };

describe('adfWithMention', () => {
  it('mentions the person at the start of the first paragraph', () => {
    expect(
      adfWithMention({
        doc: adfOfNote('Atualizei o plano.\n- D4: Quanto dura?'),
        mention: MARINA,
      }).content?.[0],
    ).toEqual({
      type: 'paragraph',
      content: [
        { type: 'mention', attrs: { id: 'po-marina', text: '@Marina' } },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'Atualizei o plano.' },
      ],
    });
  });

  it('opens a paragraph for the mention when the note starts with a list', () => {
    const doc = adfWithMention({ doc: adfOfNote('- D4: Quanto dura?'), mention: MARINA });

    expect(doc.content?.map(({ type }) => type)).toEqual(['paragraph', 'bulletList']);
  });

  it('leaves the note as it is with no one to mention', () => {
    const doc = adfOfNote('Atualizei o plano.');

    expect(adfWithMention({ doc, mention: null })).toBe(doc);
  });
});

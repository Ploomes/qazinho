import { describe, expect, it } from 'vitest';
import { adfOfDoubts } from '@/main/classes/integrations/JiraApi/library';

const DOUBTS = [
  { id: 'D1', question: ' Does a coupon stack with free shipping? ' },
  { id: 'D2', question: 'Which error shows for an expired coupon?' },
];

describe('adfOfDoubts', () => {
  it('opens with a mention of who wrote the story, then lists each doubt by its id', () => {
    expect(
      adfOfDoubts({
        intro: 'two doubts before we test this:',
        doubts: DOUBTS,
        closing: 'Answer naming the doubt, like D1.',
        mention: { id: 'po-7', name: 'Rui PO' },
      }),
    ).toEqual({
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'mention', attrs: { id: 'po-7', text: '@Rui PO' } },
            { type: 'text', text: ' two doubts before we test this:' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'D1', marks: [{ type: 'strong' }] },
                    { type: 'text', text: ' Does a coupon stack with free shipping?' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'D2', marks: [{ type: 'strong' }] },
                    { type: 'text', text: ' Which error shows for an expired coupon?' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Answer naming the doubt, like D1.' }],
        },
      ],
    });
  });

  it('opens with the words alone when there is no one to mention', () => {
    expect(
      adfOfDoubts({ intro: 'Doubts:', doubts: DOUBTS, closing: '', mention: null })
        .content?.[0],
    ).toEqual({ type: 'paragraph', content: [{ type: 'text', text: 'Doubts:' }] });
  });

  it('leaves out an empty opening and closing, and keeps the list', () => {
    const content =
      adfOfDoubts({ intro: ' ', doubts: DOUBTS, closing: '', mention: null }).content ??
      [];

    expect(content.map(({ type }) => type)).toEqual(['bulletList']);
  });
});

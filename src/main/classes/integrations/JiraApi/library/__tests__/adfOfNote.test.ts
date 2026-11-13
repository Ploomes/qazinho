import { describe, expect, it } from 'vitest';
import { adfOfNote } from '@/main/classes/integrations/JiraApi/library';

describe('adfOfNote', () => {
  it('writes the prose as a paragraph and the lines that start with a dash as a list', () => {
    expect(
      adfOfNote('Atualizei o plano.\n- TC-04: 5 tentativas\n- Caso novo: aviso'),
    ).toEqual({
      type: 'doc',
      version: 1,
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Atualizei o plano.' }] },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'TC-04: 5 tentativas' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Caso novo: aviso' }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('keeps the blocks the QA separated, and drops the empty lines', () => {
    expect(adfOfNote('Um.\nDois.\n\n\nTrês.').content).toEqual([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Um.' },
          { type: 'hardBreak' },
          { type: 'text', text: 'Dois.' },
        ],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Três.' }] },
    ]);
  });
});

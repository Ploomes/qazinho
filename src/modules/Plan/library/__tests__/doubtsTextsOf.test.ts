import { describe, expect, it } from 'vitest';
import { doubtsTextsOf, storyNoteOf } from '@/modules/Plan/library';

const TEMPLATE = {
  id: 't-doubts',
  kind: 'doubts' as const,
  name: 'Dúvidas do time',
  title: '',
  parts: [
    { kind: 'text' as const, text: 'Oi, time! Dúvidas sobre a {{story}}:' },
    { kind: 'section' as const, field: 'doubts', heading: '' },
    { kind: 'text' as const, text: 'Respondam aqui nomeando a dúvida.' },
  ],
  cases: 'steps' as const,
  updatedAt: '',
};

describe('the comments in the team’s template', () => {
  it('opens and closes the doubts comment with the texts around the list', () => {
    expect(doubtsTextsOf({ template: TEMPLATE, values: { story: 'SHOP-878' } })).toEqual({
      intro: 'Oi, time! Dúvidas sobre a SHOP-878:',
      closing: 'Respondam aqui nomeando a dúvida.',
    });
  });

  it('writes the decisions note by the team’s template', () => {
    expect(
      storyNoteOf({
        review: {
          summary: 'O critério 3 passou para 5.',
          at: '',
          items: [
            { id: 'R1', kind: 'doubt', question: 'Quanto dura?', state: 'applied' },
          ],
        },
        plan: [],
        words: {
          intro: (summary) => summary,
          changed: ({ id }) => id,
          added: (title) => title,
          doubt: ({ question }) => `Dúvida: ${question}`,
        },
        template: {
          ...TEMPLATE,
          kind: 'decisions',
          parts: [
            { kind: 'text', text: 'Decidido para a {{story}}: {{summary}}' },
            { kind: 'section', field: 'decisions', heading: '' },
          ],
        },
        values: { story: 'SHOP-878' },
      }),
    ).toBe(
      'Decidido para a SHOP-878: O critério 3 passou para 5.\n\n- Dúvida: Quanto dura?',
    );
  });
});

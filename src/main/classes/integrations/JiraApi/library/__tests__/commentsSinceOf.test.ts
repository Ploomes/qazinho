import { describe, expect, it } from 'vitest';
import { commentsSinceOf } from '@/main/classes/integrations/JiraApi/library';

const doc = (text: string) => ({
  type: 'doc',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

describe('commentsSinceOf', () => {
  it('keeps what others wrote after the plan, oldest first', () => {
    expect(
      commentsSinceOf({
        body: {
          comments: [
            {
              author: { accountId: 'po', displayName: 'Rui PO' },
              created: '2026-11-13T16:00:00.000Z',
              body: doc('Mudamos para 5.'),
            },
            {
              author: { accountId: 'dev', displayName: 'Lia Dev' },
              created: '2026-11-13T15:00:00.000Z',
              body: doc('Subi no staging.'),
            },
            {
              author: { accountId: 'po', displayName: 'Rui PO' },
              created: '2026-11-12T10:00:00.000Z',
              body: doc('Antes do plano.'),
            },
          ],
        },
        since: '2026-11-13T13:00:00.000Z',
        me: 'qa',
      }),
    ).toEqual([
      { author: 'Lia Dev', at: '2026-11-13T15:00:00.000Z', text: 'Subi no staging.' },
      { author: 'Rui PO', at: '2026-11-13T16:00:00.000Z', text: 'Mudamos para 5.' },
    ]);
  });

  it('does NOT count what the QA wrote, nor an empty comment', () => {
    expect(
      commentsSinceOf({
        body: {
          comments: [
            {
              author: { accountId: 'qa', displayName: 'Ana QA' },
              created: '2026-11-13T15:00:00.000Z',
              body: doc('D1 Quanto dura?'),
            },
            {
              author: { accountId: 'po' },
              created: '2026-11-13T15:00:00.000Z',
              body: null,
            },
          ],
        },
        since: '2026-11-13T13:00:00.000Z',
        me: 'qa',
      }),
    ).toEqual([]);
  });
});

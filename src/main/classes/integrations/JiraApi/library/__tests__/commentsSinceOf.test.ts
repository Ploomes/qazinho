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
        skip: ['10041'],
      }),
    ).toEqual([
      { author: 'Lia Dev', at: '2026-11-13T15:00:00.000Z', text: 'Subi no staging.' },
      { author: 'Rui PO', at: '2026-11-13T16:00:00.000Z', text: 'Mudamos para 5.' },
    ]);
  });

  /** Um comentário que o QA escreveu à mão no Jira é novidade; só o que o QAzinho postou não é. */
  it('does NOT count what QAzinho posted, nor an empty comment', () => {
    expect(
      commentsSinceOf({
        body: {
          comments: [
            {
              id: '10041',
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
        skip: ['10041'],
      }),
    ).toEqual([]);
  });

  it('counts what the QA wrote by hand in the story', () => {
    expect(
      commentsSinceOf({
        body: {
          comments: [
            {
              id: '10050',
              author: { accountId: 'qa', displayName: 'Ana QA' },
              created: '2026-11-13T15:00:00.000Z',
              body: doc('Falei com a Marina: minúsculas valem.'),
            },
          ],
        },
        since: '2026-11-13T13:00:00.000Z',
        skip: ['10041'],
      }),
    ).toEqual([
      {
        author: 'Ana QA',
        at: '2026-11-13T15:00:00.000Z',
        text: 'Falei com a Marina: minúsculas valem.',
      },
    ]);
  });

  /** Um comentário velho reescrito depois do plano mudou o que a história diz. */
  it('counts a comment edited after the plan, at the time of the edit', () => {
    expect(
      commentsSinceOf({
        body: {
          comments: [
            {
              id: '10030',
              author: { accountId: 'po', displayName: 'Rui PO' },
              created: '2026-11-12T10:00:00.000Z',
              updated: '2026-11-13T17:00:00.000Z',
              body: doc('O cupom vale por 48 horas.'),
            },
            {
              id: '10031',
              author: { accountId: 'po', displayName: 'Rui PO' },
              created: '2026-11-12T10:00:00.000Z',
              updated: '2026-11-12T11:00:00.000Z',
              body: doc('Editado antes do plano.'),
            },
          ],
        },
        since: '2026-11-13T13:00:00.000Z',
        skip: [],
      }),
    ).toEqual([
      {
        author: 'Rui PO',
        at: '2026-11-13T17:00:00.000Z',
        text: 'O cupom vale por 48 horas.',
      },
    ]);
  });

  /** O QA pode completar à mão uma dúvida que o QAzinho postou: o que ele acrescentou conta. */
  it('counts a comment QAzinho posted once someone edits it, and never before', () => {
    const posted = {
      id: '10041',
      author: { accountId: 'qa', displayName: 'Ana QA' },
      created: '2026-11-13T15:00:00.000Z',
      body: doc('D1 Quanto dura? Combinamos 24h na reunião.'),
    };

    expect(
      commentsSinceOf({
        body: { comments: [{ ...posted, updated: '2026-11-13T15:00:00.000Z' }] },
        since: '2026-11-13T13:00:00.000Z',
        skip: ['10041'],
      }),
    ).toEqual([]);
    expect(
      commentsSinceOf({
        body: { comments: [{ ...posted, updated: '2026-11-13T16:30:00.000Z' }] },
        since: '2026-11-13T13:00:00.000Z',
        skip: ['10041'],
      }),
    ).toEqual([
      {
        author: 'Ana QA',
        at: '2026-11-13T16:30:00.000Z',
        text: 'D1 Quanto dura? Combinamos 24h na reunião.',
      },
    ]);
  });
});

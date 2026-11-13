import { describe, expect, it } from 'vitest';
import { storyAnswersOf } from '@/main/classes/integrations/JiraApi/library';

const SITE = 'https://shop.atlassian.net/browse/SHOP-878';
const ASKED = { url: `${SITE}?focusedCommentId=100`, at: '2026-11-13T13:00:00.000Z' };
const QA = { accountId: 'qa-1', displayName: 'Ana QA' };
const PO = { accountId: 'po-7', displayName: 'Rui PO' };

/** Um comentário do Jira com o texto num parágrafo só. */
function comment(props: { id: string; author: typeof QA; at: string; text: string }) {
  return {
    id: props.id,
    author: props.author,
    created: props.at,
    body: {
      type: 'doc',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: props.text }] }],
    },
  };
}

const answersOf = (comments: ReturnType<typeof comment>[], ids = ['D1', 'D2']) =>
  storyAnswersOf({
    comments: { comments },
    doubts: ids.map((id) => ({ id, sent: ASKED })),
    me: 'qa-1',
  });

describe('storyAnswersOf', () => {
  it('splits one comment that answers each doubt by its id', () => {
    expect(
      answersOf([
        comment({
          id: '101',
          author: PO,
          at: '2026-11-13T14:00:00.000Z',
          text: 'D1: yes, they stack. D2 - "This coupon expired"',
        }),
      ]),
    ).toEqual([
      {
        doubtId: 'D1',
        text: 'yes, they stack.',
        by: 'Rui PO',
        at: '2026-11-13T14:00:00.000Z',
      },
      {
        doubtId: 'D2',
        text: '"This coupon expired"',
        by: 'Rui PO',
        at: '2026-11-13T14:00:00.000Z',
      },
    ]);
  });

  it('gives two doubts named together the answer that follows them', () => {
    expect(
      answersOf([
        comment({
          id: '101',
          author: PO,
          at: '2026-11-13T14:00:00.000Z',
          text: 'D1 and D2: no.',
        }),
      ]).map(({ doubtId, text }) => `${doubtId} ${text}`),
    ).toEqual(['D1 no.', 'D2 no.']);
  });

  it('takes a comment that names no doubt as the answer when only one waits', () => {
    expect(
      answersOf(
        [
          comment({
            id: '101',
            author: PO,
            at: '2026-11-13T14:00:00.000Z',
            text: 'They stack.',
          }),
        ],
        ['D1'],
      ),
    ).toEqual([
      {
        doubtId: 'D1',
        text: 'They stack.',
        by: 'Rui PO',
        at: '2026-11-13T14:00:00.000Z',
      },
    ]);
  });

  it('does NOT guess which of several doubts a comment with no id answers', () => {
    expect(
      answersOf([
        comment({
          id: '101',
          author: PO,
          at: '2026-11-13T14:00:00.000Z',
          text: 'They stack.',
        }),
      ]),
    ).toEqual([]);
  });

  it('does NOT take the QA’s own comments, the one that asked, or one from before', () => {
    expect(
      answersOf([
        comment({
          id: '100',
          author: QA,
          at: '2026-11-13T13:00:00.000Z',
          text: 'D1 Stack? D2 Error?',
        }),
        comment({
          id: '101',
          author: QA,
          at: '2026-11-13T14:00:00.000Z',
          text: 'D1 still open',
        }),
        comment({
          id: '99',
          author: PO,
          at: '2026-11-12T10:00:00.000Z',
          text: 'D1: old talk',
        }),
      ]),
    ).toEqual([]);
  });

  it('keeps the first answer a doubt got, and reads the comments in time order', () => {
    expect(
      answersOf(
        [
          comment({
            id: '103',
            author: PO,
            at: '2026-11-13T16:00:00.000Z',
            text: 'D1: changed my mind',
          }),
          comment({
            id: '102',
            author: PO,
            at: '2026-11-13T15:00:00.000Z',
            text: 'D01: yes',
          }),
        ],
        ['D1'],
      ),
    ).toEqual([
      { doubtId: 'D1', text: 'yes', by: 'Rui PO', at: '2026-11-13T15:00:00.000Z' },
    ]);
  });

  it('reads nothing from an answer that is not a list of comments', () => {
    expect(
      storyAnswersOf({ comments: null, doubts: [{ id: 'D1', sent: ASKED }], me: '' }),
    ).toEqual([]);
  });
});

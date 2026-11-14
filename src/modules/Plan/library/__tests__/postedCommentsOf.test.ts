import { describe, expect, it } from 'vitest';
import { postedCommentsOf } from '@/modules/Plan/library';

const doubt = (url: string | null) => ({
  id: 'D1',
  question: 'Qual mensagem?',
  sent: url === null ? null : { url, at: '2026-11-14T10:00:00.000Z' },
  answer: null,
});

describe('postedCommentsOf', () => {
  it('names the comments QAzinho posted, the doubts and the told ones, once each', () => {
    expect(
      postedCommentsOf({
        doubts: [
          doubt('https://acme.atlassian.net/browse/SHOP-878?focusedCommentId=10041'),
          doubt('https://acme.atlassian.net/browse/SHOP-878?focusedCommentId=10041'),
          doubt(null),
        ],
        told: ['https://acme.atlassian.net/browse/SHOP-878?focusedCommentId=10052'],
      }),
    ).toEqual(['10041', '10052']);
  });

  it('skips an address with no comment in it', () => {
    expect(
      postedCommentsOf({
        doubts: [],
        told: ['https://acme.atlassian.net/browse/SHOP-878'],
      }),
    ).toEqual([]);
  });
});

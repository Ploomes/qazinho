import { describe, expect, it } from 'vitest';
import { githubTrackerIssueOf } from '@/main/classes/integrations/BugFiler/library';

describe('githubTrackerIssueOf', () => {
  it('reads the issue and the comments under it', () => {
    expect(
      githubTrackerIssueOf({
        issue: JSON.stringify({
          number: 42,
          title: 'Coupon',
          html_url: 'https://github.com/acme/shop/issues/42',
          state: 'closed',
          body: 'The total drops.',
        }),
        comments: JSON.stringify([
          {
            user: { login: 'bia' },
            created_at: '2026-10-22T13:00:00Z',
            body: 'Fixed in #50.',
          },
          { user: { login: 'bot' }, created_at: '2026-10-22T13:01:00Z', body: ' ' },
        ]),
      }),
    ).toEqual({
      key: '#42',
      title: 'Coupon',
      url: 'https://github.com/acme/shop/issues/42',
      status: 'closed',
      isClosed: true,
      body: 'The total drops.',
      comments: [{ author: 'bia', at: '2026-10-22', text: 'Fixed in #50.' }],
    });
  });

  it('reads nothing out of an answer that is no issue, and no comments out of a broken list', () => {
    expect(
      githubTrackerIssueOf({ issue: '{"message":"Not Found"}', comments: '[]' }),
    ).toBeNull();
    expect(
      githubTrackerIssueOf({ issue: '{"number":1,"state":"open"}', comments: 'oops' })
        ?.comments,
    ).toEqual([]);
  });
});

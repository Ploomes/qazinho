import { describe, expect, it } from 'vitest';
import { githubIssueOf } from '@/main/classes/integrations/BugFiler/library';

describe('githubIssueOf', () => {
  it('reads the number and page of the issue GitHub made', () => {
    expect(
      githubIssueOf(
        JSON.stringify({
          number: 42,
          html_url: 'https://github.com/acme/shop/issues/42',
          title: 'Coupon refused',
        }),
      ),
    ).toEqual({ number: 42, url: 'https://github.com/acme/shop/issues/42' });
  });

  it('reads nothing out of an answer that is not an issue', () => {
    expect(githubIssueOf('{"message":"Not Found"}')).toBeNull();
    expect(githubIssueOf('not json')).toBeNull();
  });
});

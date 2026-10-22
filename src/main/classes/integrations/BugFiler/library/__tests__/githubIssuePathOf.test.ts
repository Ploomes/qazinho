import { describe, expect, it } from 'vitest';
import { githubIssuePathOf } from '@/main/classes/integrations/BugFiler/library';

describe('githubIssuePathOf', () => {
  it('reads the API path out of an issue’s page', () => {
    expect(githubIssuePathOf('https://github.com/acme/shop.web/issues/42')).toBe(
      'repos/acme/shop.web/issues/42',
    );
  });

  it('reads nothing out of a page that is no issue', () => {
    expect(githubIssuePathOf('https://github.com/acme/shop/pull/42')).toBeNull();
    expect(githubIssuePathOf('https://evil.test/acme/shop/issues/42')).toBeNull();
  });
});

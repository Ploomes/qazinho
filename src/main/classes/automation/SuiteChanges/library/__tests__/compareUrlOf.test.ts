import { describe, expect, it } from 'vitest';
import { compareUrlOf } from '@/main/classes/automation/SuiteChanges/library';

describe('compareUrlOf', () => {
  it("opens GitHub's page that makes the pull request, branch against base", () => {
    expect(
      compareUrlOf({
        repository: 'acme/chat-e2e',
        base: 'main',
        branch: 'qazinho/fix-ct-nav-002',
      }),
    ).toBe(
      'https://github.com/acme/chat-e2e/compare/main...qazinho/fix-ct-nav-002?expand=1',
    );
  });

  it('keeps the slashes of a branch and writes anything else safely', () => {
    expect(
      compareUrlOf({
        repository: 'acme/e2e',
        base: 'release/2.0',
        branch: 'qazinho/a#b',
      }),
    ).toBe('https://github.com/acme/e2e/compare/release/2.0...qazinho/a%23b?expand=1');
  });

  it('has no page away from GitHub, or with no branch it came from', () => {
    expect(
      compareUrlOf({ repository: null, base: 'main', branch: 'qazinho/x' }),
    ).toBeNull();
    expect(
      compareUrlOf({ repository: 'acme/e2e', base: '', branch: 'qazinho/x' }),
    ).toBeNull();
  });
});

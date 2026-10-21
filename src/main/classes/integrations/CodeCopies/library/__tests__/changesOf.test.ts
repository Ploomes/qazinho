import { describe, expect, it } from 'vitest';
import { changesOf } from '@/main/classes/integrations/CodeCopies/library';

describe('changesOf', () => {
  it('reads the files a comparison changed, and its commits', () => {
    expect(
      changesOf(
        JSON.stringify({
          commits: 3,
          files: [
            { path: 'src/Coupon.tsx', status: 'modified', additions: 40, deletions: 3 },
            { path: 'src/couponRules.ts', status: 'added', additions: 120, deletions: 0 },
          ],
        }),
      ),
    ).toEqual({
      commits: 3,
      changes: [
        { path: 'src/Coupon.tsx', status: 'modified', additions: 40, deletions: 3 },
        { path: 'src/couponRules.ts', status: 'added', additions: 120, deletions: 0 },
      ],
    });
  });

  it('fills in what a file left out, and skips one with no path', () => {
    expect(
      changesOf(JSON.stringify({ files: [{ path: 'a.ts' }, { status: 'added' }] })),
    ).toEqual({
      commits: 0,
      changes: [{ path: 'a.ts', status: 'modified', additions: 0, deletions: 0 }],
    });
  });

  it('does NOT read something that is not a comparison', () => {
    expect(changesOf('not json')).toBeNull();
    expect(changesOf('{"commits":1}')).toBeNull();
  });
});

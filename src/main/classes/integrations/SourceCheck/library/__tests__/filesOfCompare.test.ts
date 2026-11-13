import { describe, expect, it } from 'vitest';
import { filesOfCompare } from '@/main/classes/integrations/SourceCheck/library';

describe('filesOfCompare', () => {
  it('reads each changed file with its patch cut to a number of lines', () => {
    expect(
      filesOfCompare({
        text: JSON.stringify({
          files: [
            { filename: 'src/coupon.ts', patch: 'a\nb\nc' },
            { filename: 'logo.png' },
          ],
        }),
        files: 30,
        patchLines: 2,
      }),
    ).toEqual([
      { path: 'src/coupon.ts', patch: 'a\nb' },
      { path: 'logo.png', patch: '' },
    ]);
  });

  it('keeps only as many files as asked, and none from what is not a comparison', () => {
    expect(
      filesOfCompare({
        text: JSON.stringify({ files: [{ filename: 'a' }, { filename: 'b' }] }),
        files: 1,
        patchLines: 2,
      }),
    ).toEqual([{ path: 'a', patch: '' }]);
    expect(filesOfCompare({ text: 'not json', files: 1, patchLines: 2 })).toEqual([]);
  });
});

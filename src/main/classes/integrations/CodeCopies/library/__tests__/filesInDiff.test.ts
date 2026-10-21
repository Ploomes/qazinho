import { describe, expect, it } from 'vitest';
import { filesInDiff } from '@/main/classes/integrations/CodeCopies/library';

describe('filesInDiff', () => {
  it('counts one file per diff header', () => {
    expect(
      filesInDiff(
        'diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\ndiff --git a/y b/y\nnew file mode 100644\n',
      ),
    ).toBe(2);
  });

  it('counts nothing in an empty diff, nor a header quoted inside a line', () => {
    expect(filesInDiff('')).toBe(0);
    expect(filesInDiff('+ see diff --git a/x\n')).toBe(0);
  });
});

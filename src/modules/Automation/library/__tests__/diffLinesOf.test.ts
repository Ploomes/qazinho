import { describe, expect, it } from 'vitest';
import { diffLinesOf } from '@/modules/Automation/library';

const PATCH = `diff --git a/tests/ct-nav.spec.ts b/tests/ct-nav.spec.ts
index 3b18e51..a1b2c3d 100644
--- a/tests/ct-nav.spec.ts
+++ b/tests/ct-nav.spec.ts
@@ -12,3 +12,3 @@ test.describe('CT-NAV', () => {
   await page.goto('/');
-  await page.getByRole('link', { name: 'Meu carrinho' }).click();
+  await page.getByRole('link', { name: 'Carrinho' }).click();
 });
\\ No newline at end of file`;

describe('diffLinesOf', () => {
  it('numbers each line before and after, and leaves git header out', () => {
    expect(
      diffLinesOf(PATCH).map(({ kind, text, old, new: next }) => [kind, text, old, next]),
    ).toEqual([
      ['hunk', "@@ -12,3 +12,3 @@ test.describe('CT-NAV', () => {", null, null],
      ['same', "  await page.goto('/');", 12, 12],
      [
        'del',
        "  await page.getByRole('link', { name: 'Meu carrinho' }).click();",
        13,
        null,
      ],
      ['add', "  await page.getByRole('link', { name: 'Carrinho' }).click();", null, 13],
      ['same', '});', 14, 14],
    ]);
  });

  it('starts counting again at each hunk', () => {
    const lines = diffLinesOf('@@ -1 +1 @@\n-a\n+b\n@@ -40,2 +40,2 @@\n x\n-y\n+z');

    expect(
      lines.filter(({ kind }) => kind === 'add').map(({ new: next }) => next),
    ).toEqual([1, 41]);
  });

  it('keeps a line that only looks like a header once inside a hunk', () => {
    expect(diffLinesOf('@@ -1 +1,2 @@\n+--- not a header\n+++ nor this')).toEqual([
      expect.objectContaining({ kind: 'hunk' }),
      expect.objectContaining({ kind: 'add', text: '--- not a header' }),
      expect.objectContaining({ kind: 'add', text: '++ nor this' }),
    ]);
  });
});

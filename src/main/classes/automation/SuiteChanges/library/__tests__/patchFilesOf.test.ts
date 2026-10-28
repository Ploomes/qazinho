import { describe, expect, it } from 'vitest';
import { patchFilesOf } from '@/main/classes/automation/SuiteChanges/library';

const CHANGED = `diff --git a/tests/hc-1/ct-nav.spec.ts b/tests/hc-1/ct-nav.spec.ts
index 3b18e51..a1b2c3d 100644
--- a/tests/hc-1/ct-nav.spec.ts
+++ b/tests/hc-1/ct-nav.spec.ts
@@ -12,7 +12,7 @@ test.describe('CT-NAV', () => {
   test('CT-NAV-002 · Abre o carrinho', async ({ page }) => {
     await page.goto('/');
-    await page.getByRole('link', { name: 'Meu carrinho' }).click();
+    await page.getByRole('link', { name: /Carrinho/ }).click();
     await expect(page.getByRole('heading', { name: 'Carrinho' })).toBeVisible();
   });
`;

const ADDED = `diff --git a/tests/pages/cart.page.ts b/tests/pages/cart.page.ts
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/tests/pages/cart.page.ts
@@ -0,0 +1,2 @@
+export const CART = 'Carrinho';
+// --- not a header
`;

const DELETED = `diff --git a/tests/old.spec.ts b/tests/old.spec.ts
deleted file mode 100644
index e69de29..0000000
--- a/tests/old.spec.ts
+++ /dev/null
@@ -1 +0,0 @@
-test('old', () => {});
`;

describe('patchFilesOf', () => {
  it('splits a diff into its files, each with the lines it gained and lost', () => {
    expect(patchFilesOf(`${CHANGED}${ADDED}${DELETED}`)).toEqual([
      {
        path: 'tests/hc-1/ct-nav.spec.ts',
        status: 'modified',
        additions: 1,
        deletions: 1,
        patch: CHANGED.trimEnd(),
      },
      {
        path: 'tests/pages/cart.page.ts',
        status: 'added',
        additions: 2,
        deletions: 0,
        patch: ADDED.trimEnd(),
      },
      {
        path: 'tests/old.spec.ts',
        status: 'deleted',
        additions: 0,
        deletions: 1,
        patch: DELETED.trimEnd(),
      },
    ]);
  });

  /**
   * Um arquivo movido sem nada mudado não tem linhas --- e +++: só as linhas de rename do
   * git o nomeiam.
   */
  it('names a file moved as it is now', () => {
    expect(
      patchFilesOf(
        'diff --git a/tests/cart.spec.ts b/tests/carrinho.spec.ts\nsimilarity index 100%\nrename from tests/cart.spec.ts\nrename to tests/carrinho.spec.ts\n',
      ),
    ).toEqual([
      expect.objectContaining({
        path: 'tests/carrinho.spec.ts',
        status: 'renamed',
        additions: 0,
        deletions: 0,
      }),
    ]);
  });

  it('reads nothing out of an empty diff', () => {
    expect(patchFilesOf('')).toEqual([]);
  });
});

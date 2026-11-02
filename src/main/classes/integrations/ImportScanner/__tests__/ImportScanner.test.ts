import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ImportScanner } from '@/main/classes/integrations/ImportScanner';

/** Um git que responde o branch e o commit de uma pasta, ou recusa quando não há repo. */
const fakeGit = (isRepo: boolean) => ({
  run: (props: { cwd: string; args: string[] }) =>
    Promise.resolve(
      isRepo
        ? {
            isOk: true as const,
            text: props.args.includes('--abbrev-ref') ? 'main\n' : 'abc123\n',
          }
        : { isOk: false as const, said: 'not a git repository' },
    ),
});

async function folderWith(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-import-'));

  for (const [file, text] of Object.entries(files)) {
    await mkdir(join(root, file, '..'), { recursive: true });
    await writeFile(join(root, file), text);
  }

  return root;
}

describe('ImportScanner', () => {
  it('reads a Playwright suite and a Maestro flow in one folder', async () => {
    const root = await folderWith({
      'package.json': '{"devDependencies":{"@playwright/test":"1"}}',
      'playwright.config.ts': 'export default {};',
      'tests/cart.spec.ts': 'test("cart", async () => {});',
      '.maestro/login.yaml': 'appId: com.acme\n---\n- launchApp\n',
      'config/other.yaml': 'name: not a flow\n',
      'node_modules/dep/index.spec.js': '',
    });
    const picked = await new ImportScanner({ git: fakeGit(true) }).pick(root);

    expect(picked.kind).toBe('picked');
    if (picked.kind !== 'picked') return;

    expect(picked.source.frameworks).toEqual([
      { id: 'playwright', files: 1 },
      { id: 'maestro', files: 1 },
    ]);
    expect(picked.source.files).toEqual(['.maestro/login.yaml', 'tests/cart.spec.ts']);
    expect(picked.source.branch).toBe('main');
    expect(picked.source.commit).toBe('abc123');
  });

  it('leaves the branch empty for a folder that is not a repository', async () => {
    const root = await folderWith({ 'a.spec.ts': '' });
    const picked = await new ImportScanner({ git: fakeGit(false) }).pick(root);

    expect(picked.kind === 'picked' && picked.source.branch).toBeNull();
  });

  it('still picks a folder with no framework it knows, for the agent to read', async () => {
    const root = await folderWith({ 'checks/home.rb': 'puts 1' });
    const picked = await new ImportScanner({ git: fakeGit(false) }).pick(root);

    expect(picked.kind === 'picked' && picked.source.frameworks).toEqual([]);
  });

  it('refuses an empty folder and a path that is not a folder', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'qazinho-import-'));
    const scanner = new ImportScanner({ git: fakeGit(false) });

    expect(await scanner.pick(empty)).toEqual({ kind: 'failed', reason: 'empty' });
    expect(await scanner.pick(join(empty, 'missing'))).toEqual({
      kind: 'failed',
      reason: 'unreadable',
    });
  });

  it('reads again only a folder the QA picked here', async () => {
    const root = await folderWith({ 'a.spec.ts': '', 'playwright.config.ts': '' });
    const scanner = new ImportScanner({ git: fakeGit(false) });

    expect(await scanner.sourceOf(root)).toBeNull();

    const picked = await scanner.pick(root);

    if (picked.kind !== 'picked') throw new Error('expected a picked folder');

    expect((await scanner.sourceOf(picked.source.dir))?.files).toEqual(['a.spec.ts']);
  });
});

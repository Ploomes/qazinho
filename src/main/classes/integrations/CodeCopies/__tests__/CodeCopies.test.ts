import type { IGithubCode } from '@/main/classes/integrations/CodeCopies/types';
import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CodeCopies } from '@/main/classes/integrations/CodeCopies';

const DIFF =
  'diff --git a/src/Coupon.tsx b/src/Coupon.tsx\n--- a/src/Coupon.tsx\n+++ b/src/Coupon.tsx\n@@ -1 +1 @@\n-old\n+new\n';

/** A GitHub that answers from a table by path prefix, and unpacks a tarball as one README file. */
function fakeGithub(table: Record<string, GhAnswer>, extract?: GhAnswer) {
  const asked: { path: string; accept?: string }[] = [];
  const github: IGithubCode = {
    api: vi.fn((props: { path: string; accept?: string }): Promise<GhAnswer> => {
      asked.push(props);

      const key = Object.keys(table)
        .sort((a, b) => b.length - a.length)
        .find((prefix) =>
          `${props.accept === undefined ? '' : 'diff:'}${props.path}`.startsWith(prefix),
        );

      return Promise.resolve(
        key === undefined
          ? {
              isOk: false,
              failure: 'not-found',
              httpStatus: 404,
              said: 'gh: Not Found (HTTP 404)',
            }
          : (table[key] ?? { isOk: true, text: '' }),
      );
    }),
    extract: vi.fn(async (props: { dir: string; onBytes?: (bytes: number) => void }) => {
      if (extract !== undefined && !extract.isOk) return extract;

      await mkdir(props.dir, { recursive: true });
      await writeFile(join(props.dir, 'README.md'), 'loja');
      props.onBytes?.(2048);

      return { isOk: true, text: '' } satisfies GhAnswer;
    }),
  };

  return { github, asked };
}

const ok = (text: string): GhAnswer => ({ isOk: true, text });
const ASK = { owner: 'acme', name: 'loja-web', base: 'develop', branch: 'feat/cupom' };

async function copiesWith(table: Record<string, GhAnswer>, extract?: GhAnswer) {
  const root = join(await mkdtemp(join(tmpdir(), 'qazinho-code-')), 'code');
  const fake = fakeGithub(table, extract);

  return { root, ...fake, copies: new CodeCopies({ github: fake.github, root }) };
}

const TABLE: Record<string, GhAnswer> = {
  'repos/acme/loja-web/commits/feat/cupom': ok('aaa111\n'),
  'repos/acme/loja-web/commits/develop': ok('bbb222\n'),
  'repos/acme/loja-web/compare/bbb222...aaa111': ok(
    JSON.stringify({
      commits: 2,
      files: [{ path: 'src/Coupon.tsx', status: 'modified', additions: 1, deletions: 1 }],
    }),
  ),
  'diff:repos/acme/loja-web/compare/bbb222...aaa111': ok(DIFF),
};

describe('CodeCopies', () => {
  it('copies the branch at its commit, and keeps what it changed against the base', async () => {
    const { copies, github, root } = await copiesWith(TABLE);
    const steps: string[] = [];
    const result = await copies.prepare({
      workspaceId: 'w-1',
      code: ASK,
      onStep: ({ at }) => {
        if (steps.at(-1) !== at) steps.push(at);
      },
    });

    expect(result).toMatchObject({
      isReady: true,
      copy: {
        repository: 'acme/loja-web',
        branch: 'feat/cupom',
        base: 'develop',
        commit: 'aaa111',
        baseCommit: 'bbb222',
        root: join(root, 'w-1'),
        dir: join(root, 'w-1', 'acme', 'loja-web'),
        changes: [
          { path: 'src/Coupon.tsx', status: 'modified', additions: 1, deletions: 1 },
        ],
        changedFiles: 1,
        commits: 2,
      },
    });
    expect(steps).toEqual(['commit', 'download', 'diff']);
    expect(github.extract).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'repos/acme/loja-web/tarball/aaa111' }),
    );

    const copy = result.isReady ? result.copy : null;

    expect(await readFile(copy?.diffFile ?? '', 'utf8')).toBe(DIFF);
    expect(existsSync(join(copy?.dir ?? '', 'README.md'))).toBe(true);
    expect(copies.copyOf('w-1')).toEqual(copy);
  });

  it('copies the whole app with nothing to compare when the branch is the base', async () => {
    const { copies, asked } = await copiesWith({
      'repos/acme/loja-web/commits/develop': ok('bbb222'),
    });
    const result = await copies.prepare({
      workspaceId: 'w-1',
      code: { ...ASK, branch: 'develop' },
      onStep: () => undefined,
    });

    expect(result).toMatchObject({
      isReady: true,
      copy: {
        commit: 'bbb222',
        baseCommit: null,
        diffFile: null,
        changes: [],
        changedFiles: 0,
      },
    });
    expect(asked.some(({ path }) => path.includes('/compare/'))).toBe(false);
  });

  it('still hands over the code when GitHub cannot make the diff, with no diff file', async () => {
    const { copies } = await copiesWith({
      ...TABLE,
      'diff:repos/acme/loja-web/compare/bbb222...aaa111': {
        isOk: false,
        failure: 'unexpected',
        httpStatus: 422,
        said: 'gh: The diff is taking too long to generate. (HTTP 422)',
      },
    });
    const result = await copies.prepare({
      workspaceId: 'w-1',
      code: ASK,
      onStep: () => undefined,
    });

    expect(result).toMatchObject({
      isReady: true,
      copy: { diffFile: null, changedFiles: 1 },
    });
  });

  it('says why when GitHub does not know the branch, and copies nothing', async () => {
    const { copies, github } = await copiesWith({
      'repos/acme/loja-web/commits/develop': ok('bbb222'),
    });

    expect(
      await copies.prepare({ workspaceId: 'w-1', code: ASK, onStep: () => undefined }),
    ).toEqual({ isReady: false, failure: 'not-found', said: 'gh: Not Found (HTTP 404)' });
    expect(github.extract).not.toHaveBeenCalled();
    expect(copies.copyOf('w-1')).toBeNull();
  });

  it('leaves nothing on disk when the download fails', async () => {
    const { copies, root } = await copiesWith(TABLE, {
      isOk: false,
      failure: 'unreachable',
      httpStatus: null,
      said: 'The download took too long.',
    });

    expect(
      await copies.prepare({ workspaceId: 'w-1', code: ASK, onStep: () => undefined }),
    ).toMatchObject({ isReady: false, failure: 'unreachable' });
    expect(existsSync(join(root, 'w-1'))).toBe(false);
  });

  it('deletes a copy once released, and every copy on a sweep', async () => {
    const { copies, root } = await copiesWith(TABLE);

    await copies.prepare({ workspaceId: 'w-1', code: ASK, onStep: () => undefined });
    await copies.prepare({ workspaceId: 'w-2', code: ASK, onStep: () => undefined });
    await copies.release('w-1');

    expect(existsSync(join(root, 'w-1'))).toBe(false);
    expect(copies.copyOf('w-1')).toBeNull();
    expect(existsSync(join(root, 'w-2'))).toBe(true);

    await copies.sweep();

    expect(existsSync(root)).toBe(false);
    expect(copies.copyOf('w-2')).toBeNull();
  });
});

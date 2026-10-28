import type { GithubSignInProgress } from '@/shared/types';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CodeCopies } from '@/main/classes/integrations/CodeCopies';
import { GithubCli } from '@/main/classes/integrations/GithubCli';
import { GithubRepos } from '@/main/classes/integrations/GithubRepos';

/**
 * O gh como o real se comporta quando não está num terminal (lido do gh 2.20): `auth
 * login --web` imprime um código de uso único e a página do dispositivo, depois espera o
 * QA autorizar no navegador, que o arquivo `authorized` representa. O `api` responde os
 * caminhos que o QAzinho pede, pelos filtros jq que ele passa, um 404 do jeito que o gh
 * diz um, e um tarball de um app pequeno com a pasta de topo.
 */
const FAKE_GH = String.raw`#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
LAST="$${'{@: -1}'}"
if [ "$1" = "api" ] && [ "$2" = "--include" ]; then
  if [ -f "$ROOT/signed-in" ]; then
    printf 'HTTP/2.0 200 OK\nX-Oauth-Scopes: gist, read:org, repo\n\n{"login":"octoqa"}'
    exit 0
  fi
  echo "To get started with GitHub CLI, please run:  gh auth login" >&2
  exit 4
fi
if [ "$1" = "auth" ] && [ "$2" = "login" ]; then
  echo
  echo "! First copy your one-time code: AB12-CD34"
  echo "Open this URL to continue in your web browser: https://github.com/login/device"
  while [ ! -f "$ROOT/authorized" ]; do sleep 0.05; done
  touch "$ROOT/signed-in"
  echo "✓ Authentication complete." >&2
  exit 0
fi
case "$LAST" in
  user/repos*)
    echo '{"id":4242,"owner":"acme","name":"loja-web","isPrivate":true,"defaultBranch":"develop","pushedAt":"2026-10-20T10:00:00Z","description":"A loja na web"}'
    ;;
  repos/acme/loja-web)
    echo 'develop'
    ;;
  repos/acme/loja-web/branches*)
    printf 'develop\nfeat/cupom\n'
    ;;
  repos/acme/loja-web/activity*)
    echo '{"ref":"refs/heads/feat/cupom","timestamp":"2026-10-20T09:00:00Z"}'
    ;;
  repos/acme/loja-web/pulls*)
    echo '{"number":42,"title":"Cupom no checkout","head":"feat/cupom","headRepo":"acme/loja-web","updatedAt":"2026-10-20T11:00:00Z"}'
    ;;
  repos/acme/loja-web/commits/develop)
    echo 'dev0000000000000000000000000000000000001'
    ;;
  repos/acme/loja-web/commits/feat/cupom)
    echo 'c0ffee0000000000000000000000000000000002'
    ;;
  repos/acme/loja-web/tarball/*)
    tar -czf - -C "$ROOT/app" acme-loja-web-c0ffee0
    ;;
  repos/acme/loja-web/compare/*)
    if [[ "$*" == *"vnd.github.diff"* ]]; then
      printf 'diff --git a/src/couponRules.ts b/src/couponRules.ts\nnew file mode 100644\n'
    else
      echo '{"commits":1,"files":[{"path":"src/couponRules.ts","status":"added","additions":4,"deletions":0}]}'
    fi
    ;;
  *)
    echo '{"message":"Not Found"}'
    echo "gh: Not Found (HTTP 404)" >&2
    exit 1
    ;;
esac
`;

async function fakeGh() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-gh-'));
  const app = join(root, 'app', 'acme-loja-web-c0ffee0', 'src');

  await mkdir(app, { recursive: true });
  await writeFile(
    join(app, 'couponRules.ts'),
    'export const COUPONS = { SAVE10: 0.1 };\n',
  );
  await writeFile(join(root, 'gh'), FAKE_GH);
  await chmod(join(root, 'gh'), 0o755);

  const heard: GithubSignInProgress[] = [];
  const cli = new GithubCli({
    directories: () => Promise.resolve([root, '/usr/bin', '/bin']),
    onProgress: (progress) => heard.push(progress),
  });

  return { root, cli, heard };
}

async function until(check: () => boolean) {
  for (let tries = 0; tries < 200 && !check(); tries += 1)
    await new Promise((done) => setTimeout(done, 25));
}

describe('GitHub through a fake gh', () => {
  it('signs gh in with its device code, then reads the account it came back as', async () => {
    const { root, cli, heard } = await fakeGh();

    expect(await cli.status()).toMatchObject({ account: null, failure: 'signed-out' });

    const signing = cli.signIn();

    await until(() =>
      heard.some((progress) => progress.phase === 'working' && progress.at === 'browser'),
    );

    expect(
      heard.find((progress) => progress.phase === 'working' && progress.code !== null),
    ).toMatchObject({
      at: 'browser',
      code: 'AB12-CD34',
      url: 'https://github.com/login/device',
    });

    await writeFile(join(root, 'authorized'), '');

    expect(await signing).toMatchObject({ phase: 'connected', account: 'octoqa' });
    expect(await cli.status()).toMatchObject({
      account: 'octoqa',
      missingScopes: [],
      failure: null,
    });
  });

  it('stops a sign-in the QA cancels, and gh with it', async () => {
    const { cli, heard } = await fakeGh();
    const signing = cli.signIn();

    await until(() =>
      heard.some((progress) => progress.phase === 'working' && progress.at === 'browser'),
    );
    cli.cancelSignIn();

    expect(await signing).toMatchObject({ phase: 'cancelled' });
  });

  it('lists the repositories and the branches, the base first and the pull request named', async () => {
    const { root, cli } = await fakeGh();

    await writeFile(join(root, 'signed-in'), '');

    const repos = new GithubRepos({ github: cli });

    expect(await repos.repositories()).toMatchObject({
      isListed: true,
      repositories: [{ owner: 'acme', name: 'loja-web', defaultBranch: 'develop' }],
    });
    expect(await repos.branches({ owner: 'acme', name: 'loja-web' })).toEqual({
      isListed: true,
      branches: [
        { name: 'develop', isDefault: true, pullRequest: null, movedAt: null },
        {
          name: 'feat/cupom',
          isDefault: false,
          pullRequest: { number: 42, title: 'Cupom no checkout' },
          movedAt: '2026-10-20T11:00:00Z',
        },
      ],
    });
    expect(await repos.branches({ owner: 'acme', name: 'missing' })).toEqual({
      isListed: false,
      failure: 'not-found',
    });
  });

  it('copies a branch through gh and tar, with what it changed, and deletes it once released', async () => {
    const { root, cli } = await fakeGh();
    const copies = new CodeCopies({ github: cli, root: join(root, 'code') });
    const result = await copies.prepare({
      workspaceId: 'w-1',
      code: { owner: 'acme', name: 'loja-web', base: 'develop', branch: 'feat/cupom' },
      onStep: () => undefined,
    });

    expect(result).toMatchObject({
      isReady: true,
      copy: {
        commit: 'c0ffee0000000000000000000000000000000002',
        baseCommit: 'dev0000000000000000000000000000000000001',
        changedFiles: 1,
        commits: 1,
      },
    });

    const copy = result.isReady ? result.copy : null;

    expect(
      await readFile(join(copy?.dir ?? '', 'src', 'couponRules.ts'), 'utf8'),
    ).toContain('SAVE10');
    expect(await readFile(copy?.diffFile ?? '', 'utf8')).toContain('couponRules.ts');

    await copies.release('w-1');

    expect(existsSync(join(root, 'code', 'w-1'))).toBe(false);
    await rm(root, { recursive: true, force: true });
  });
});

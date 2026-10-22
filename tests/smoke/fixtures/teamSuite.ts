import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, realpath, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('./suite', import.meta.url));

/** Runs git in a folder, with what it printed. */
export function git(props: { cwd: string; args: string[] }): string {
  return execFileSync('git', props.args, { cwd: props.cwd, encoding: 'utf8' }).trim();
}

/**
 * The fixture suite as a team keeps it: a git repository of its own in a temporary folder, one
 * commit on main, its Playwright reached through a link to this repository's packages, and a
 * bare remote beside it to push to. QAzinho's own repository is never touched.
 */
export async function teamSuite(): Promise<{
  folder: string;
  repo: string;
  remote: string;
}> {
  const folder = await realpath(await mkdtemp(join(tmpdir(), 'qazinho-team-')));
  const repo = join(folder, 'e2e');
  const remote = join(folder, 'remote.git');

  await cp(SOURCE, repo, { recursive: true });
  await symlink(join(process.cwd(), 'node_modules'), join(repo, 'node_modules'));
  await writeFile(join(repo, '.gitignore'), 'node_modules\n');
  git({ cwd: folder, args: ['init', '--bare', '--quiet', remote] });
  git({ cwd: repo, args: ['init', '--quiet', '-b', 'main'] });
  git({ cwd: repo, args: ['config', 'user.name', 'QA'] });
  git({ cwd: repo, args: ['config', 'user.email', 'qa@shop.test'] });
  git({ cwd: repo, args: ['add', '-A'] });
  git({ cwd: repo, args: ['commit', '--quiet', '-m', 'test(hc-1): navigation'] });
  git({ cwd: repo, args: ['remote', 'add', 'origin', remote] });

  return { folder, repo, remote };
}

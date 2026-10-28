import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, realpath, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('./suite', import.meta.url));

/** Roda o git numa pasta, com o que ele imprimiu. */
export function git(props: { cwd: string; args: string[] }): string {
  return execFileSync('git', props.args, { cwd: props.cwd, encoding: 'utf8' }).trim();
}

/**
 * A suíte de fixture como um time a mantém: um repositório git próprio numa pasta
 * temporária, um commit na main, o Playwright dela alcançado por um link para os pacotes
 * deste repositório, e um remoto bare ao lado para dar push. O repositório do próprio
 * QAzinho nunca é tocado.
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

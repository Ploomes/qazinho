import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Brings the QA's work over from the folder the app kept before it was renamed; the old folder stays as it was. */
export function adoptDataDir(props: { from: string; to: string }): boolean {
  const { from, to } = props;
  const hasWork = (root: string) =>
    existsSync(join(root, 'projects.json')) || existsSync(join(root, 'workspaces'));

  if (!hasWork(from) || hasWork(to)) return false;

  cpSync(from, to, { recursive: true, force: false, errorOnExist: false });

  const workspaces = join(to, 'workspaces');
  const oldRoot = JSON.stringify(from).slice(1, -1);
  const newRoot = JSON.stringify(to).slice(1, -1);

  for (const id of existsSync(workspaces) ? readdirSync(workspaces) : []) {
    const file = join(workspaces, id, 'workspace.json');

    if (!existsSync(file)) continue;

    writeFileSync(file, readFileSync(file, 'utf8').replaceAll(oldRoot, newRoot));
  }

  return true;
}

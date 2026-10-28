import type { IChangedPath } from '@/main/classes/automation/SuiteChanges/types';

/**
 * Os caminhos que uma cópia mudou, de `git status --porcelain=v1 -z`: um rename pega o
 * caminho novo, e o que o git ignora nunca aparece.
 */
export function changedPathsOf(text: string): IChangedPath[] {
  const fields = text.split('\0');
  const changed: IChangedPath[] = [];

  for (let at = 0; at < fields.length; at += 1) {
    const field = fields[at] ?? '';

    if (field.length < 4) continue;

    const code = field.slice(0, 2);

    changed.push({ path: field.slice(3), status: statusOf(code) });

    if (code.includes('R') || code.includes('C')) at += 1;
  }

  return changed;
}

function statusOf(code: string): IChangedPath['status'] {
  if (code === '??') return 'untracked';

  if (code.includes('R')) return 'renamed';

  if (code.includes('D')) return 'deleted';

  return code.includes('A') ? 'added' : 'modified';
}

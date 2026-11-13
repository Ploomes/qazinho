import type { ISourceChange } from '@/shared/types';

/** Como o QA chama a fonte que mudou: a história, a página, a branch ou a reunião. */
export function changeNameOf(change: ISourceChange): string {
  switch (change.kind) {
    case 'story':
      return change.key;
    case 'page':
      return change.title;
    case 'code':
      return change.branch;
    case 'meeting':
      return change.name;
  }
}

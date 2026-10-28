import type { SuiteChangeAsk } from '@/shared/types';
import { SUITE_CHANGES } from '@/main/classes/automation/SuiteChanges/constants';
import { askTitleOf } from './askTitleOf';

/** A branch em que uma mudança vai, nomeada pelo que faz a qual teste. */
export function branchNameOf(ask: SuiteChangeAsk): string {
  const slug = askTitleOf(ask)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const verb = ask.kind === 'fix' ? 'fix' : 'test';
  const name = `${verb}-${slug}`.slice(0, SUITE_CHANGES.branchChars).replace(/-+$/, '');

  return `${SUITE_CHANGES.branchPrefix}${name === verb ? `${verb}-new` : name}`;
}

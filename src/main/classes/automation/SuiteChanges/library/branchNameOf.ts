import type { SuiteChangeAsk } from '@/shared/types';
import { SUITE_CHANGES } from '@/main/classes/automation/SuiteChanges/constants';
import { askTitleOf } from './askTitleOf';

/** The branch a change goes on, named after what it does to which test: qazinho/fix-ct-nav-002-abre-o-carrinho, or qazinho/test-cart-survives-a-reload for a new one. */
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

import type { SuiteChangeAsk } from '@/shared/types';
import { SUITE_CHANGES } from '@/main/classes/automation/SuiteChanges/constants';

/** The branch a change goes on, named after what it does to which test: qazinho/fix-ct-nav-002-abre-o-carrinho. */
export function branchNameOf(ask: SuiteChangeAsk): string {
  const slug = ask.test.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const name = `fix-${slug}`.slice(0, SUITE_CHANGES.branchChars).replace(/-+$/, '');

  return `${SUITE_CHANGES.branchPrefix}${name === 'fix' ? 'fix-test' : name}`;
}

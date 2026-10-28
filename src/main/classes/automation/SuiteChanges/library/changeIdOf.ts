import { SUITE_CHANGES } from '@/main/classes/automation/SuiteChanges/constants';

/**
 * A mudança a que o escopo de um agente pertence, ou null quando o escopo não é de uma
 * mudança.
 */
export function changeIdOf(scope: string): string | null {
  return scope.startsWith(SUITE_CHANGES.scopePrefix)
    ? scope.slice(SUITE_CHANGES.scopePrefix.length) || null
    : null;
}

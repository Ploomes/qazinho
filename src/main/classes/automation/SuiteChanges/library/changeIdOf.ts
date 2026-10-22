import { SUITE_CHANGES } from '@/main/classes/automation/SuiteChanges/constants';

/** The change an agent's scope belongs to, or null when the scope is not a change's. */
export function changeIdOf(scope: string): string | null {
  return scope.startsWith(SUITE_CHANGES.scopePrefix)
    ? scope.slice(SUITE_CHANGES.scopePrefix.length) || null
    : null;
}

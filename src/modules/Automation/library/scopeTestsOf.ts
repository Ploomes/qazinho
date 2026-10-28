import type { ISuiteTest, SuiteScope } from '@/modules/Automation/types';
import { folderOf } from './folderOf';

/**
 * Os testes que o QA pediu para rodar alcançam: todos, os de um arquivo ou guardados pela
 * própria pasta, ou alguns pelo id.
 */
export function scopeTestsOf(props: {
  tests: ISuiteTest[];
  scope: SuiteScope;
}): ISuiteTest[] {
  const { tests, scope } = props;

  if (scope.kind === 'all') return tests;

  return scope.kind === 'path'
    ? tests.filter(({ file }) => file === scope.path || folderOf(file) === scope.path)
    : tests.filter(({ id }) => scope.testIds.includes(id));
}

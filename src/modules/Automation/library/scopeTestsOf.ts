import type { ISuiteTest, SuiteScope } from '@/modules/Automation/types';
import { folderOf } from './folderOf';

/** The tests what the QA asked to run reaches: all of them, those in a file or held by a folder itself, or some by their id. */
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

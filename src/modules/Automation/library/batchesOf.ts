import type { ISuiteTest, SuiteScope } from '@/modules/Automation/types';
import type { ISuiteBatch } from '@/shared/types';
import { scopeTestsOf } from './scopeTestsOf';

/**
 * The batches a run goes through, a Playwright project at a time, each naming the tests
 * it runs.
 */
export function batchesOf(props: {
  tests: ISuiteTest[];
  projects: string[];
  scope: SuiteScope;
}): ISuiteBatch[] {
  const { tests, scope } = props;
  const order = props.projects.length === 0 ? [''] : props.projects;

  if (scope.kind === 'all') return order.map((project) => ({ project, filters: [] }));

  const chosen = scopeTestsOf({ tests, scope });

  return order.flatMap((project) => {
    const ofProject = chosen.filter((test) => test.project === project);

    if (ofProject.length === 0) return [];

    return [
      {
        project,
        filters: [
          ...new Set(
            ofProject.map(({ file, line }) =>
              scope.kind === 'path' ? file : `${file}:${String(line)}`,
            ),
          ),
        ],
      },
    ];
  });
}

import type { IRun } from '@/modules/Run/types';
import { EXPLORATION } from '@/shared/constants';

/**
 * The run as the QA reads it: an exploration's one case, its screens, takes the name the
 * QA reads for an exploration.
 */
export function withExplorationTitle(props: { run: IRun; title: string }): IRun {
  const { run, title } = props;

  if (run.kind !== 'explore') return run;

  return {
    ...run,
    cases: run.cases.map((runCase) =>
      runCase.id === EXPLORATION.caseId && runCase.title.length === 0
        ? { ...runCase, title }
        : runCase,
    ),
  };
}

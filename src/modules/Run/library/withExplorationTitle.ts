import type { IRun } from '@/modules/Run/types';
import { EXPLORATION } from '@/shared/constants';

/**
 * A run como o QA a lê: o caso único de uma exploração, as telas dela, leva o nome que o
 * QA lê para uma exploração.
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

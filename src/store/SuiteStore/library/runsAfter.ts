import type { ISuiteRun, SuiteEvent } from '@/shared/types';

/**
 * As runs de um projeto depois de um evento: uma run que começa vai primeiro, um teste
 * que termina cai na run dele, e uma run que termina toma a forma final.
 */
export function runsAfter(props: { runs: ISuiteRun[]; event: SuiteEvent }): ISuiteRun[] {
  const { runs, event } = props;

  if (event.kind === 'started')
    return [event.run, ...runs.filter(({ id }) => id !== event.run.id)];

  if (event.kind === 'ended')
    return runs.some(({ id }) => id === event.run.id)
      ? runs.map((run) => (run.id === event.run.id ? event.run : run))
      : [event.run, ...runs];

  if (event.kind === 'total')
    return runs.map((run) =>
      run.id === event.runId ? { ...run, total: event.total } : run,
    );

  if (event.kind === 'testEnded')
    return runs.map((run) =>
      run.id === event.runId
        ? {
            ...run,
            results: [
              ...run.results.filter(({ testId }) => testId !== event.result.testId),
              event.result,
            ],
          }
        : run,
    );

  return runs;
}

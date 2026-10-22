import type { ISuiteRun, SuiteEvent } from '@/shared/types';

/** A project's runs once one event of a run is heard: a run that starts goes first, a test that ends lands in its run, and a run that ends takes its final shape. */
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

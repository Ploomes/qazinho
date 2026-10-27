import type { SuiteEvent } from '@/shared/types';
import type { ISuiteLive } from '@/store/SuiteStore/types';

/**
 * The run going on a project once one of its events is heard: the tests running with the
 * step each is on, until the run ends.
 */
export function liveAfter(props: {
  live: ISuiteLive | null;
  event: SuiteEvent;
}): ISuiteLive | null {
  const { live, event } = props;

  if (event.kind === 'started') return { runId: event.run.id, going: {} };

  if (event.kind === 'ended') return live?.runId === event.run.id ? null : live;

  if (live === null || !('runId' in event) || event.runId !== live.runId) return live;

  if (event.kind === 'testStarted')
    return { ...live, going: { ...live.going, [event.testId]: null } };

  if (event.kind === 'step')
    return { ...live, going: { ...live.going, [event.testId]: event.title } };

  if (event.kind === 'testEnded')
    return {
      ...live,
      going: Object.fromEntries(
        Object.entries(live.going).filter(([testId]) => testId !== event.result.testId),
      ),
    };

  return live;
}

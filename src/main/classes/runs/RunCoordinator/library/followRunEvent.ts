import type { IRunEvent, IRunInFlight } from '@/shared/types';

/** A run in flight after one more event: the step it is on, the stream, and what it has judged. */
export function followRunEvent(props: {
  run: IRunInFlight;
  event: IRunEvent;
}): IRunInFlight {
  const { run, event } = props;

  if (event.kind === 'doing') return { ...run, doingIndex: event.index };

  if (event.kind === 'streaming') return { ...run, streamUrl: event.url };

  if (event.kind === 'step')
    return { ...run, doingIndex: -1, outcomes: [...run.outcomes, event.outcome] };

  return run;
}

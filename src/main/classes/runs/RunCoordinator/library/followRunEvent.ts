import type { IRunEvent, IRunInFlight } from '@/shared/types';

/**
 * Uma run em andamento depois de mais um evento: o passo em que está, o stream, o que
 * julgou, e a pergunta que espera.
 */
export function followRunEvent(props: {
  run: IRunInFlight;
  event: IRunEvent;
}): IRunInFlight {
  const { run, event } = props;

  if (event.kind === 'doing') return { ...run, doingIndex: event.index, how: event.how };

  if (event.kind === 'streaming') return { ...run, streamUrl: event.url };

  if (event.kind === 'address') return { ...run, address: event.url };

  if (event.kind === 'screens') return { ...run, screens: event.screens };

  if (event.kind === 'step')
    return { ...run, doingIndex: -1, outcomes: [...run.outcomes, event.outcome] };

  if (event.kind === 'finding')
    return { ...run, findings: [...run.findings, event.finding] };

  if (event.kind === 'asked') return { ...run, question: event.question };

  if (event.kind === 'manual') return { ...run, manual: event.turn };

  if (event.kind === 'answered')
    return {
      ...run,
      question: run.question?.id === event.asked.id ? null : run.question,
      asked: [...run.asked, event.asked],
    };

  if (event.kind === 'cost')
    return { ...run, costUsd: (run.costUsd ?? 0) + event.costUsd };

  return run;
}

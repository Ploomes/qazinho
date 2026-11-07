import type { IToolDone } from '@/modules/Assistant/types';

/**
 * A resposta de uma chamada se ela chega a tempo, senão uma que diz que ainda espera; a
 * chamada segue sozinha.
 */
export function withinWait(props: {
  work: Promise<IToolDone>;
  ms: number;
  pending: string;
}): Promise<IToolDone> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  props.work.catch(() => undefined);

  const late = new Promise<IToolDone>((done) => {
    timer = setTimeout(() => {
      done({ text: props.pending, isError: false });
    }, props.ms);
  });

  return Promise.race([props.work, late]).finally(() => {
    clearTimeout(timer);
  });
}

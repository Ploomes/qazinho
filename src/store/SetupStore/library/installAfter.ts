import type { InstallState } from '@/modules/Setup';
import type { IInstallResult, ISetupEvent } from '@/shared/types';

/**
 * O próximo estado da instalação, a partir de uma linha que ela imprimiu ou de como
 * terminou. Uma linha depois do fim não muda nada.
 */
export function installAfter(props: {
  state: InstallState | undefined;
  news: ISetupEvent | IInstallResult;
}): InstallState | undefined {
  const { state, news } = props;

  if ('isInstalled' in news)
    return news.isInstalled
      ? { phase: 'installed' }
      : {
          phase: 'failed',
          failure: news.failure,
          command: news.command,
          isFix: news.isFix,
        };

  if (state?.phase !== 'installing') return state;

  return { phase: 'installing', stage: news.stage, stages: news.stages, line: news.line };
}

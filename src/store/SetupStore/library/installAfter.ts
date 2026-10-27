import type { InstallState } from '@/modules/Setup';
import type { IInstallResult, ISetupEvent } from '@/shared/types';

/**
 * The install's next state, from a line it printed or from how it ended. A line after the
 * end changes nothing.
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

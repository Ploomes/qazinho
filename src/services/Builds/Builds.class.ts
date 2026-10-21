import type { IBuildEvent, IBuildResult, IStartBuild } from '@/shared/types';
import { i18n } from '@/languages';

/** The only caller of the build side of the bridge. */
export class Builds {
  public static async start(build: IStartBuild): Promise<IBuildResult> {
    return (
      (await window.qazinho?.startBuild(build)) ?? {
        isBuilt: false,
        failure: {
          reason: 'agent',
          failure: { reason: 'other', said: i18n.t('COMMON.NO_BRIDGE') },
        },
      }
    );
  }

  public static async stop(buildId: string): Promise<void> {
    await window.qazinho?.stopBuild(buildId);
  }

  public static onEvent(listener: (event: IBuildEvent) => void): () => void {
    return window.qazinho?.onBuildEvent(listener) ?? (() => undefined);
  }
}

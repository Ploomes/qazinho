import type { InstallableId } from '@/types';
import { useMachineCheck } from '@/modules/Setup/hooks/useMachineCheck';
import { Setup } from '@/services';
import { useSetupStore } from '@/store';

/** Installs a tool and, once it lands, looks at the machine again so every screen sees it. */
export const useInstall = () => {
  const installs = useSetupStore((state) => state.installs);
  const startInstall = useSetupStore((state) => state.startInstall);
  const finishInstall = useSetupStore((state) => state.finishInstall);
  const { check } = useMachineCheck();

  return {
    installs,
    install: async (item: InstallableId) => {
      if (installs[item]?.phase === 'installing') return;

      startInstall(item);

      const result = await Setup.install(item);

      finishInstall({ item, result });

      if (result.isInstalled) await check();
    },
  };
};

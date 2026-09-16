import { useTranslation } from 'react-i18next';
import { useAppStore, useMachineStore } from '@/store';

export const useResourcePopoverViewModel = () => {
  const { t } = useTranslation();
  const isOpen = useAppStore((state) => state.isResourcesOpen);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const resources = useMachineStore((state) => state.resources);

  const ramGb = resources.ramMb / 1024;

  return {
    isOpen,
    processes: [...resources.processes].sort(
      (first, second) => second.ramMb - first.ramMb,
    ),
    header:
      resources.processes.length === 0
        ? t('RESOURCES.NOTHING_RUNNING')
        : t('RESOURCES.RUNNING', {
            count: resources.processes.length,
            ram: ramGb.toFixed(1),
          }),
    onClose: toggleResources,
  };
};

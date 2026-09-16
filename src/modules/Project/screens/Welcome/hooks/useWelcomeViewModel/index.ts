import { useCallback } from 'react';
import { useAppStore } from '@/store';

export const useWelcomeViewModel = () => {
  const openModal = useAppStore((state) => state.openModal);

  const onNewProject = useCallback(() => openModal('project'), [openModal]);

  return { onNewProject };
};

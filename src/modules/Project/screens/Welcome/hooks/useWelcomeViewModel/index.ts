import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store';

export const useWelcomeViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const openModal = useAppStore((state) => state.openModal);
  const openWorkspaceModal = useAppStore((state) => state.openWorkspaceModal);

  const project = projects.find(({ id }) => id === selectedProjectId) ?? projects[0];

  if (project === undefined)
    return {
      mood: 'sleeping' as const,
      title: t('WELCOME.TITLE'),
      body: t('WELCOME.BODY'),
      action: t('WELCOME.ACTION'),
      onAction: () => {
        openModal('project');
      },
    };

  return {
    mood: 'neutral' as const,
    title: t('WELCOME.PICK_TITLE'),
    body: t('WELCOME.PICK_BODY', { project: project.name }),
    action: t('WELCOME.PICK_ACTION'),
    onAction: () => {
      openWorkspaceModal(project.id);
    },
  };
};

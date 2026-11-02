import type { IImportFieldProps } from '@/modules/Project/components/ProjectModal/components/ImportField/types';
import { useTranslation } from 'react-i18next';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useImportFieldViewModel = (props: IImportFieldProps) => {
  const { projectId } = props;
  const { t } = useTranslation();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const own = workspaces.filter((workspace) => workspace.projectId === projectId);
  const target = own.find(({ id }) => id === selectedWorkspaceId) ?? own[0] ?? null;

  return {
    canImport: projectId !== null && target !== null,
    buttonLabel: t('PROJECT.IMPORT_BUTTON'),
    note:
      projectId === null
        ? t('PROJECT.IMPORT_LATER')
        : target === null
          ? t('PROJECT.IMPORT_NEEDS_WORKSPACE')
          : null,
    onImport: () => {
      if (target === null) return;

      const app = useAppStore.getState();

      app.selectWorkspace(target.id);
      useWorkspaceStore.getState().selectTab('chat');
      app.requestCommand('import-plan');
      app.closeModal();
    },
  };
};

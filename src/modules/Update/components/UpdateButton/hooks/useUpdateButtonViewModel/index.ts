import { useTranslation } from 'react-i18next';
import { isRunGoing } from '@/modules/Update/library';
import { Updates } from '@/services';
import { useUpdateStore, useWorkspaceStore } from '@/store';

export const useUpdateButtonViewModel = () => {
  const { t } = useTranslation();
  const update = useUpdateStore((state) => state.update);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isDisabled = isRunGoing(workspaces);

  return {
    isShown: update.phase === 'ready',
    label: t('UPDATE.ACTION'),
    tip: isDisabled
      ? t('UPDATE.AFTER_RUN')
      : t('UPDATE.READY_TIP', {
          version: update.phase === 'ready' ? update.version : '',
        }),
    isDisabled,
    onClick: () => {
      if (!isDisabled) Updates.install();
    },
  };
};

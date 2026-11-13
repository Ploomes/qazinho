import type { INamedNoteProps } from '@/modules/Chat/screens/Chat/components/NamedNote/types';
import { useTranslation } from 'react-i18next';
import { NAMED_KEYS } from '@/modules/Chat/screens/Chat/components/NamedNote/constants';
import { useAppStore } from '@/store';

export const useNamedNoteViewModel = ({ message }: INamedNoteProps) => {
  const { t } = useTranslation();
  const openProjectSection = useAppStore((state) => state.openProjectSection);
  const isThere = useAppStore((state) =>
    state.projects.some(({ id }) => id === message.projectId),
  );

  return {
    textKey: NAMED_KEYS[message.from],
    name: message.name,
    canRename: isThere,
    renameLabel: t('CHAT.NAMED_RENAME'),
    onRename: () => {
      openProjectSection({ projectId: message.projectId, section: 'general' });
    },
  };
};

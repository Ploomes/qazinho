import type { ISkillsNoteProps } from '@/modules/Chat/screens/Chat/components/SkillsNote/types';
import { useTranslation } from 'react-i18next';

export const useSkillsNoteViewModel = ({ message }: ISkillsNoteProps) => {
  const { t, i18n } = useTranslation();
  const names = new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(
    message.names,
  );

  return {
    text:
      message.names.length === 1
        ? t('CHAT.FOLLOWING_SKILL_ONE', { names })
        : t('CHAT.FOLLOWING_SKILL_OTHER', { names }),
  };
};

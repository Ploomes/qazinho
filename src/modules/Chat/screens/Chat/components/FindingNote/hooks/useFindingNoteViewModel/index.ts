import type { IFindingNoteProps } from '@/modules/Chat/screens/Chat/components/FindingNote/types';
import { useTranslation } from 'react-i18next';

export const useFindingNoteViewModel = (props: IFindingNoteProps) => {
  const { t } = useTranslation();

  return {
    tag: props.message.isSeenAgain === true ? t('BUG.SEEN_AGAIN') : t('BUG.OUTSIDE_PLAN'),
    onOpen: () => {
      props.onOpenBug(props.message.bugId);
    },
  };
};

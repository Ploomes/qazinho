import { useTranslation } from 'react-i18next';
import { RELEASE_NOTES } from '@/modules/Help/constants';
import { releaseDayOf, shippedNotesOf } from '@/modules/Help/library';
import { APP_VERSION } from '@/modules/Settings/constants';
import { useAppStore } from '@/store';

export const useNewsModalViewModel = () => {
  const { t, i18n } = useTranslation();
  const closeModal = useAppStore((state) => state.closeModal);

  return {
    title: t('HELP.NEWS_TITLE'),
    closeLabel: t('COMMON.CLOSE'),
    releases: shippedNotesOf({ notes: RELEASE_NOTES, version: APP_VERSION }).map(
      (release) => ({
        key: release.version,
        version: t('HELP.NEWS_VERSION', { version: release.version }),
        day: releaseDayOf({ date: release.date, language: i18n.language }),
        notes: release.notes.map((key) => ({ key, text: t(key) })),
      }),
    ),
    onClose: closeModal,
  };
};

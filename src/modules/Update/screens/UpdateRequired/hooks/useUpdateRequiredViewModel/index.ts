import type { InternMood } from '@/shared/components/atoms/Intern/types';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Pro, Updates } from '@/services';
import { useUpdateStore } from '@/store';

export const useUpdateRequiredViewModel = () => {
  const { t } = useTranslation();
  const update = useUpdateStore((state) => state.update);
  const isInstalling = update.phase === 'installing';
  const percent = isInstalling
    ? 100
    : update.phase === 'downloading'
      ? update.percent
      : 0;
  const isReady = update.phase === 'ready';
  const isFailed = update.phase === 'failed';
  const isStore = update.phase === 'store';
  const mood: InternMood = isReady || isStore ? 'passed' : isFailed ? 'flaky' : 'running';

  return {
    mood,
    title: t('UPDATE.REQUIRED_TITLE'),
    body: t('UPDATE.REQUIRED_BODY'),
    stateKey: isReady ? 'ready' : isFailed ? 'failed' : isStore ? 'store' : 'working',
    isWorking: !isReady && !isFailed && !isStore,
    workingLabel: isInstalling
      ? t('UPDATE.RESTARTING')
      : update.phase === 'downloading'
        ? t('UPDATE.DOWNLOADING', { percent })
        : t('UPDATE.CHECKING'),
    percent,
    barStyle: { '--update-progress': `${String(percent / 100)}` } as CSSProperties,
    isReady,
    restartLabel: t('UPDATE.RESTART'),
    onRestart: () => {
      Updates.install();
    },
    isFailed,
    failedLabel: t('UPDATE.FAILED'),
    downloadLabel: t('UPDATE.DOWNLOAD'),
    onDownload: () => {
      void Pro.openPage('/download');
    },
    isStore,
    storeLabel: t('UPDATE.STORE'),
    openStoreLabel: t('UPDATE.OPEN_STORE'),
    onOpenStore: () => {
      Updates.openStore();
    },
  };
};

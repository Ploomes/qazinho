import type { IStorageUsage, IVideoSweep } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VIDEO_KEEPING } from '@/modules/Settings/constants';
import { sizeWordsOf } from '@/modules/Settings/library';
import { Storage } from '@/services';
import { useSettingsStore } from '@/store';

export const useStorageSettingsViewModel = () => {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const days = useSettingsStore((state) => state.videoKeepDays);
  const keepVideosFor = useSettingsStore((state) => state.keepVideosFor);
  const [usage, setUsage] = useState<IStorageUsage | null>(null);
  const [reads, setReads] = useState(0);
  const [isSweeping, setSweeping] = useState(false);
  const [swept, setSwept] = useState<IVideoSweep | null>(null);

  useEffect(() => {
    void Storage.usage().then(setUsage);
  }, [reads]);
  const sizeOf = (bytes: number) => sizeWordsOf({ bytes, language });

  return {
    total:
      usage === null
        ? t('SETTINGS.STORAGE_MEASURING')
        : t('SETTINGS.STORAGE_TOTAL', { size: sizeOf(usage.total) }),
    rows:
      usage === null
        ? []
        : [
            {
              id: 'videos',
              label: t('SETTINGS.STORAGE_VIDEOS'),
              size: sizeOf(usage.videos),
            },
            {
              id: 'screens',
              label: t('SETTINGS.STORAGE_SCREENS'),
              size: sizeOf(usage.screens),
            },
            {
              id: 'builds',
              label: t('SETTINGS.STORAGE_BUILDS'),
              size: sizeOf(usage.builds),
            },
            {
              id: 'other',
              label: t('SETTINGS.STORAGE_OTHER'),
              size: sizeOf(usage.other),
            },
          ],
    keepLabel: t('SETTINGS.KEEP_VIDEOS'),
    keeping: VIDEO_KEEPING.map((one) => ({
      id: one.id,
      label: t(one.labelKey),
      className:
        one.days === days ? 'settings__choice settings__choice--on' : 'settings__choice',
      onPick: () => {
        keepVideosFor(one.days);
        setSwept(null);
      },
    })),
    keepNote: t('SETTINGS.KEEP_NOTE'),
    canSweep: days !== null && !isSweeping,
    sweepLabel: isSweeping ? t('SETTINGS.SWEEPING') : t('SETTINGS.SWEEP_NOW'),
    onSweep: () => {
      if (days === null || isSweeping) return;
      setSweeping(true);
      void Storage.sweepVideos(days).then((result) => {
        setSweeping(false);
        setSwept(result);
        setReads((count) => count + 1);
      });
    },
    sweptLine:
      swept === null
        ? null
        : swept.removed === 0
          ? t('SETTINGS.SWEPT_NONE')
          : swept.removed === 1
            ? t('SETTINGS.SWEPT_ONE', { size: sizeOf(swept.freedBytes) })
            : t('SETTINGS.SWEPT_OTHER', {
                count: swept.removed,
                size: sizeOf(swept.freedBytes),
              }),
  };
};

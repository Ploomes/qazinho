import type { IStorageRow } from '@/modules/Settings/screens/Settings/components/StorageSettings/types';
import type { StorageKind } from '@/modules/Settings/types';
import type { IStorageUsage, IVideoSweep } from '@/shared/types';
import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STORAGE_KINDS, VIDEO_KEEPING } from '@/modules/Settings/constants';
import { percentLabelOf, sizePartsOf, sizeWordsOf } from '@/modules/Settings/library';
import { STORAGE_MOTION } from '@/modules/Settings/screens/Settings/components/StorageSettings/constants';
import { Storage } from '@/services';
import { useSettingsStore } from '@/store';

export const useStorageSettingsViewModel = () => {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const days = useSettingsStore((state) => state.videoKeepDays);
  const keepVideosFor = useSettingsStore((state) => state.keepVideosFor);
  const isCalm = useReducedMotion() ?? false;
  const [measured, setMeasured] = useState<{
    usage: IStorageUsage | null;
    read: number;
  } | null>(null);
  const [reads, setReads] = useState(0);
  const [isSweeping, setSweeping] = useState(false);
  const [swept, setSwept] = useState<IVideoSweep | null>(null);
  const [activeId, setActiveId] = useState<StorageKind | null>(null);

  useEffect(() => {
    void Storage.usage().then((usage) => {
      setMeasured({ usage, read: reads });
    });
  }, [reads]);

  const usage = measured?.usage ?? null;
  const sizeOf = (bytes: number) => sizeWordsOf({ bytes, language });

  const rows: IStorageRow[] = STORAGE_KINDS.map(({ id, labelKey }) => {
    const bytes = usage?.[id] ?? 0;
    const isActive = activeId === id;
    const isDim = activeId !== null && !isActive;

    return {
      id,
      label: t(labelKey),
      size: usage === null ? '' : sizeOf(bytes),
      share:
        usage === null
          ? ''
          : percentLabelOf({ part: bytes, total: usage.total, language }),
      bytes,
      isPending: usage === null,
      className: [
        'usage-bar__row',
        isActive ? 'usage-bar__row--active' : '',
        isDim ? 'usage-bar__row--dim' : '',
        usage === null ? 'usage-bar__row--pending' : '',
        usage !== null && bytes === 0 ? 'usage-bar__row--empty' : '',
      ]
        .filter((part) => part !== '')
        .join(' '),
      swatchClassName: `usage-bar__swatch usage-bar__tone--${id}`,
      segmentClassName: [
        'usage-bar__segment',
        `usage-bar__tone--${id}`,
        isDim ? 'usage-bar__segment--dim' : '',
      ]
        .filter((part) => part !== '')
        .join(' '),
    };
  });

  return {
    isLoading: usage === null,
    isRefreshing: measured !== null && measured.read !== reads,
    measuringLabel: t('SETTINGS.STORAGE_MEASURING'),
    hero: usage === null ? null : sizePartsOf({ bytes: usage.total, language }),
    caption: t('SETTINGS.STORAGE_CAPTION'),
    isEmpty: usage !== null && usage.total === 0,
    rows,
    segments: rows.filter(({ bytes }) => bytes > 0),
    stackMotion: STORAGE_MOTION.stack,
    itemMotion: STORAGE_MOTION.item,
    barMotion: isCalm ? STORAGE_MOTION.calmBar : STORAGE_MOTION.bar,
    growth: isCalm ? STORAGE_MOTION.still : STORAGE_MOTION.grow,
    onActivate: setActiveId,
    onDeactivate: () => {
      setActiveId(null);
    },
    keepLabel: t('SETTINGS.KEEP_VIDEOS'),
    keepOptions: VIDEO_KEEPING.map(({ id, labelKey }) => ({ id, label: t(labelKey) })),
    keepValue: VIDEO_KEEPING.find((one) => one.days === days)?.id ?? '',
    onKeepChange: (id: string) => {
      const one = VIDEO_KEEPING.find((item) => item.id === id);

      if (one === undefined) return;

      keepVideosFor(one.days);
      setSwept(null);
    },
    rule:
      days === null ? t('SETTINGS.KEEP_RULE_ALWAYS') : t('SETTINGS.KEEP_RULE', { days }),
    ruleKey: days === null ? 'always' : String(days),
    keepNote: t('SETTINGS.KEEP_NOTE'),
    canSweep: days !== null && !isSweeping,
    isSweeping,
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
    sweptTone:
      swept === null ? null : swept.removed === 0 ? ('none' as const) : ('done' as const),
    sweptIcon:
      swept === null
        ? null
        : swept.removed === 0
          ? ('skipped' as const)
          : ('passed' as const),
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

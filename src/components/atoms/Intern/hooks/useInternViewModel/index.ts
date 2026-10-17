import type { IInternProps } from '@/components/atoms/Intern/types';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { INTERN, INTERN_MOODS } from '@/components/atoms/Intern/constants';
import { useAppStore } from '@/store';

export const useInternViewModel = (props: IInternProps) => {
  const { mood, size = INTERN.defaultSize } = props;
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const art = INTERN_MOODS[mood];

  return {
    alt: t('MASCOT.ALT', {
      name: t('MASCOT.NAME'),
      mood: t(art.labelKey as 'MASCOT.MOOD_NEUTRAL'),
    }),
    style: {
      '--intern-size': `${String(size)}px`,
      '--intern-sheet': `url("${theme === 'dark' ? art.dark : art.light}")`,
      '--intern-frames': art.frames,
      '--intern-duration': `${String(art.frames * art.frameMs)}ms`,
    } as CSSProperties,
  };
};

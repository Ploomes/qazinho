import type { IBrokenRegionProps } from '@/shared/components/organisms/ErrorBarrier/components/BrokenRegion/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BROKEN_TITLES } from '@/shared/components/organisms/ErrorBarrier/constants';

export const useBrokenRegionViewModel = (props: IBrokenRegionProps) => {
  const { region, error, onRetry } = props;
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const [isCopied, setCopied] = useState(false);
  const detail = error.stack ?? `${error.name}: ${error.message}`;

  return {
    className: `broken-region broken-region--${region}`,
    title: t(BROKEN_TITLES[region]),
    text: t('BROKEN.TEXT'),
    retryLabel: t('BROKEN.RELOAD'),
    copyLabel: isCopied ? t('BROKEN.COPIED') : t('BROKEN.COPY'),
    detailsLabel: t('BROKEN.DETAILS'),
    detail,
    isOpen,
    onRetry,
    onCopy: () => {
      void navigator.clipboard.writeText(detail).then(() => {
        setCopied(true);
      });
    },
    onToggle: () => {
      setOpen(!isOpen);
    },
  };
};

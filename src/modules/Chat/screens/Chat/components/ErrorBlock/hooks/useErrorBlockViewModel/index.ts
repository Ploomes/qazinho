import type { IErrorBlockProps } from '@/modules/Chat/screens/Chat/components/ErrorBlock/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store';

export const useErrorBlockViewModel = (props: IErrorBlockProps) => {
  const { t } = useTranslation();
  const [isExpanded, setExpanded] = useState(false);
  const toggleModelMenu = useAppStore((state) => state.toggleModelMenu);
  const detail = props.message.detail ?? '';

  return {
    kicker: t('CHAT.ERROR_KICKER'),
    text: props.message.text,
    fix: props.message.fix,
    detail,
    hasDetail: detail.trim().length > 0,
    isExpanded,
    toggleLabel: t(isExpanded ? 'CHAT.ERROR_HIDE_DETAIL' : 'CHAT.ERROR_SHOW_DETAIL'),
    canRetry: props.onRetry !== undefined,
    retryLabel: t('CHAT.ERROR_RETRY'),
    modelLabel: t('CHAT.ERROR_MODEL'),
    onRetry: () => {
      props.onRetry?.();
    },
    onModel: () => {
      toggleModelMenu('composer');
    },
    onToggle: () => {
      setExpanded((open) => !open);
    },
  };
};

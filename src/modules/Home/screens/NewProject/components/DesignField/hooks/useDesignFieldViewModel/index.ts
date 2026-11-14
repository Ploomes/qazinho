import type { IDesignFieldProps } from '@/modules/Home/screens/NewProject/components/DesignField/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { designLinkOf } from '@/modules/Workspace';

export const useDesignFieldViewModel = (props: IDesignFieldProps) => {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const [text, setText] = useState(value?.url ?? '');
  const isTyped = text.trim() !== '';

  return {
    label: t('NEW_PROJECT.DESIGN_LABEL'),
    placeholder: t('NEW_PROJECT.DESIGN_PLACEHOLDER'),
    text,
    onText: (typed: string) => {
      setText(typed);
      onChange(designLinkOf(typed));
    },
    statusText:
      value !== null
        ? t('NEW_PROJECT.DESIGN_OK', { name: value.name })
        : isTyped
          ? t('NEW_PROJECT.DESIGN_INVALID')
          : '',
    statusClassName:
      value !== null
        ? 'field-card__status field-card__status--ok'
        : isTyped
          ? 'field-card__status field-card__status--bad'
          : 'field-card__status',
  };
};

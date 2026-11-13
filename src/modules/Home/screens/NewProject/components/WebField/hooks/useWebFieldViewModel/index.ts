import type { IWebFieldProps } from '@/modules/Home/screens/NewProject/components/WebField/types';
import { useTranslation } from 'react-i18next';
import { webAddressOf } from '@/modules/Project';

export const useWebFieldViewModel = (props: IWebFieldProps) => {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const address = webAddressOf(value);
  const isTyped = value.trim() !== '';

  return {
    label: t('NEW_PROJECT.WEB_LABEL'),
    placeholder: t('NEW_PROJECT.WEB_PLACEHOLDER'),
    value,
    onChange,
    statusText:
      address !== null
        ? t('NEW_PROJECT.WEB_OK', { host: new URL(address).host })
        : isTyped
          ? t('NEW_PROJECT.WEB_INVALID')
          : '',
    statusClassName:
      address !== null
        ? 'field-card__status field-card__status--ok'
        : isTyped
          ? 'field-card__status field-card__status--bad'
          : 'field-card__status',
  };
};

import type { ITestsFieldProps } from '@/modules/Home/screens/NewProject/components/TestsField/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Imports } from '@/services';

export const useTestsFieldViewModel = (props: ITestsFieldProps) => {
  const { value, onChange } = props;
  const { t, i18n } = useTranslation();
  const [isPicking, setPicking] = useState(false);
  const [failure, setFailure] = useState<'empty' | 'unreadable' | null>(null);
  const frameworks = new Intl.ListFormat(i18n.language, {
    style: 'long',
    type: 'conjunction',
  }).format(value?.frameworks.map(({ id }) => id) ?? []);

  return {
    label: t('NEW_PROJECT.TESTS_LABEL'),
    pickLabel:
      value === null ? t('NEW_PROJECT.TESTS_PICK') : t('NEW_PROJECT.TESTS_CHANGE'),
    isPicking,
    path: value?.dir ?? '',
    hasPath: value !== null,
    statusText:
      failure === 'empty'
        ? t('NEW_PROJECT.TESTS_EMPTY')
        : failure === 'unreadable'
          ? t('NEW_PROJECT.TESTS_UNREADABLE')
          : value === null
            ? t('NEW_PROJECT.TESTS_HINT')
            : value.frameworks.length === 0
              ? t('NEW_PROJECT.TESTS_UNKNOWN', { name: value.name })
              : t('NEW_PROJECT.TESTS_OK', {
                  frameworks,
                  count: value.files.length,
                  name: value.name,
                }),
    statusClassName:
      failure !== null
        ? 'field-card__status field-card__status--bad'
        : value === null
          ? 'field-card__status'
          : 'field-card__status field-card__status--ok',
    onPick: () => {
      setPicking(true);
      void Imports.pick().then((picked) => {
        setPicking(false);
        setFailure(picked.kind === 'failed' ? picked.reason : null);

        if (picked.kind === 'picked') onChange(picked.source);
      });
    },
  };
};

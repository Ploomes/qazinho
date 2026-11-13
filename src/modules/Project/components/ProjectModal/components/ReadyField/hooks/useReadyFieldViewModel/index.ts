import type { IReadyFieldProps } from '@/modules/Project/components/ProjectModal/components/ReadyField/types';
import type { JiraStatusList } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { READY_FIELD } from '@/modules/Project/components/ProjectModal/components/ReadyField/constants';
import { JIRA_FAILURE_KEYS } from '@/modules/Setup/constants';
import { Jira } from '@/services';

export const useReadyFieldViewModel = (props: IReadyFieldProps) => {
  const { statuses, onChange } = props;
  const { t } = useTranslation();
  const [listed, setListed] = useState<JiraStatusList | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let isLive = true;

    void Jira.statuses().then((read) => {
      if (isLive) setListed(read);
    });

    return () => {
      isLive = false;
    };
  }, []);

  const isOn = (name: string) =>
    statuses.some((status) => status.trim().toLowerCase() === name.trim().toLowerCase());
  const seen = new Set<string>();
  const names = [
    ...(listed?.isListed === true ? listed.statuses.map(({ name }) => name) : []),
    ...statuses,
  ].filter((name) => {
    const key = name.trim().toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);

    return true;
  });
  const typed = query.trim().toLowerCase();

  return {
    label: t('PROJECT.READY'),
    note: t('PROJECT.READY_NOTE'),
    isLoading: listed === null,
    loadingText: t('PROJECT.READY_LOADING'),
    failure: listed?.isListed === false ? t(JIRA_FAILURE_KEYS[listed.failure]) : null,
    hasFilter: names.length > READY_FIELD.filterFrom,
    filterLabel: t('PROJECT.READY_FILTER'),
    query,
    options: names
      .filter((name) => typed === '' || isOn(name) || name.toLowerCase().includes(typed))
      .map((name) => ({
        name,
        isOn: isOn(name),
        className: isOn(name)
          ? 'ready-field__status ready-field__status--on'
          : 'ready-field__status',
      })),
    onQuery: setQuery,
    onToggle: (name: string) => {
      onChange(
        isOn(name)
          ? statuses.filter((status) => status.toLowerCase() !== name.toLowerCase())
          : [...statuses, name],
      );
    },
  };
};

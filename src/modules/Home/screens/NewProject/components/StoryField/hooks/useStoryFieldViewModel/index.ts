import type { IStoryFieldProps } from '@/modules/Home/screens/NewProject/components/StoryField/types';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { confluenceWantedOf, pickPage } from '@/modules/Assistant';
import { storyKeyOf } from '@/modules/Home/library';
import { INTEGRATIONS, JIRA_FAILURE_KEYS } from '@/modules/Setup';
import { Confluence, Jira } from '@/services';
import { useSetupStore } from '@/store';

export const useStoryFieldViewModel = (props: IStoryFieldProps) => {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const jira = useSetupStore(
    (state) => state.integrations.find(({ id }) => id === 'jira') ?? null,
  );
  const [text, setText] = useState(
    value === null ? '' : value.kind === 'jira' ? value.issue.key : value.page.url,
  );
  const [isReading, setReading] = useState(false);
  const [failure, setFailure] = useState('');
  const integration = INTEGRATIONS.find(({ id }) => id === 'jira') ?? null;

  const read = async () => {
    const typed = text.trim();
    const key = storyKeyOf(typed);

    if (typed === '' || isReading) return;

    setReading(true);
    setFailure('');

    if (key !== null) {
      const found = await Jira.search(key);
      const exact = found.isListed
        ? found.issues.find((issue) => issue.key === key)
        : null;

      setReading(false);

      if (!found.isListed) setFailure(t(JIRA_FAILURE_KEYS[found.failure]));
      else if (exact === null || exact === undefined)
        setFailure(t('NEW_PROJECT.STORY_NOT_FOUND'));
      else onChange({ kind: 'jira', issue: exact });

      return;
    }

    if (jira?.confluence !== true) {
      setReading(false);
      setFailure(t('NEW_PROJECT.STORY_NOT_FOUND'));

      return;
    }

    const wanted = confluenceWantedOf(typed);
    const pages = await Confluence.search(wanted.title === '' ? typed : wanted.title);
    const page = pages.isListed ? pickPage({ wanted, pages: pages.pages }) : null;

    setReading(false);

    if (!pages.isListed) setFailure(t(JIRA_FAILURE_KEYS[pages.failure]));
    else if (page === null) setFailure(t('NEW_PROJECT.STORY_NOT_FOUND'));
    else onChange({ kind: 'page', page });
  };

  return {
    label: t('NEW_PROJECT.STORY_LABEL'),
    placeholder: t('NEW_PROJECT.STORY_PLACEHOLDER'),
    needsJira: jira === null,
    hasIntegration: jira === null && integration !== null,
    integration,
    text,
    readLabel: isReading ? t('NEW_PROJECT.STORY_READING') : t('NEW_PROJECT.STORY_READ'),
    canRead: text.trim() !== '' && !isReading && value === null,
    statusText:
      jira === null
        ? t('NEW_PROJECT.STORY_NEEDS')
        : failure !== ''
          ? failure
          : value === null
            ? ''
            : value.kind === 'jira'
              ? t('NEW_PROJECT.STORY_OK_JIRA', {
                  key: value.issue.key,
                  summary: value.issue.summary,
                })
              : t('NEW_PROJECT.STORY_OK_PAGE', { title: value.page.title }),
    statusClassName:
      failure !== ''
        ? 'field-card__status field-card__status--bad'
        : value !== null
          ? 'field-card__status field-card__status--ok'
          : 'field-card__status',
    onText: (typed: string) => {
      setText(typed);
      setFailure('');

      if (value !== null) onChange(null);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      void read();
    },
    onRead: () => {
      void read();
    },
  };
};

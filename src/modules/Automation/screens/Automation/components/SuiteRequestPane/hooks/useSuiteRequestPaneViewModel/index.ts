import type { ISuiteRequestPaneProps } from '@/modules/Automation/screens/Automation/components/SuiteRequestPane/types';
import { useTranslation } from 'react-i18next';
import { requestTitleOf } from '@/modules/Automation/library';

export const useSuiteRequestPaneViewModel = (props: ISuiteRequestPaneProps) => {
  const { t } = useTranslation();
  const { ask } = props.change;
  const title = requestTitleOf(ask);

  return {
    eyebrow: t('AUTOMATION.REQUEST_NEW_TEST'),
    title,
    text: ask.kind === 'write' && ask.text !== '' && ask.text !== title ? ask.text : '',
    from:
      ask.kind === 'write' && ask.source !== null
        ? t('AUTOMATION.REQUEST_FROM', {
            id: ask.source.id,
            title: ask.source.title,
            workspace: ask.source.workspace,
          })
        : '',
    where:
      ask.kind === 'write' && ask.folder !== ''
        ? t('AUTOMATION.REQUEST_IN', { folder: ask.folder })
        : t('AUTOMATION.REQUEST_IN_SUITE'),
    card: props,
  };
};

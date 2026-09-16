import type { IIntegration } from '@/modules/Settings/types';
import github from '@/modules/Settings/assets/github.svg';
import jira from '@/modules/Settings/assets/jira.svg';

export const INTEGRATIONS: IIntegration[] = [
  {
    id: 'github',
    name: 'GitHub',
    logo: github,
    textKey: 'SETTINGS.GITHUB_TEXT',
    needsKey: 'SETTINGS.GITHUB_NEEDS',
    rows: [
      { labelKey: 'SETTINGS.ROW_ACCOUNT', valueKey: 'SETTINGS.NOT_LINKED' },
      {
        labelKey: 'SETTINGS.ROW_REPOSITORIES',
        valueKey: 'SETTINGS.ROW_REPOSITORIES_VALUE',
      },
      { labelKey: 'SETTINGS.ROW_SCOPE', valueKey: 'SETTINGS.ROW_SCOPE_VALUE' },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    logo: jira,
    textKey: 'SETTINGS.JIRA_TEXT',
    needsKey: 'SETTINGS.JIRA_NEEDS',
    rows: [
      { labelKey: 'SETTINGS.ROW_SITE', valueKey: 'SETTINGS.NOT_LINKED' },
      { labelKey: 'SETTINGS.ROW_PROJECT', valueKey: 'SETTINGS.ROW_PROJECT_VALUE' },
      { labelKey: 'SETTINGS.ROW_ISSUE_TYPE', valueKey: 'SETTINGS.ROW_ISSUE_TYPE_VALUE' },
    ],
  },
];

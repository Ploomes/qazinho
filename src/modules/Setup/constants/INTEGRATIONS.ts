import type { IIntegration } from '@/modules/Setup/types';
import github from '@/modules/Setup/assets/github.svg';
import jira from '@/modules/Setup/assets/jira.svg';

export const INTEGRATIONS: IIntegration[] = [
  {
    id: 'github',
    name: 'GitHub',
    logo: github,
    textKey: 'SETUP.GITHUB_TEXT',
    needsKey: 'SETUP.GITHUB_NEEDS',
    via: 'cli',
    tokenUrl: null,
    fields: [],
  },
  {
    id: 'jira',
    name: 'Jira',
    logo: jira,
    textKey: 'SETUP.JIRA_TEXT',
    needsKey: 'SETUP.JIRA_NEEDS',
    via: 'form',
    tokenUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    fields: [
      {
        id: 'site',
        labelKey: 'SETUP.FIELD_SITE',
        placeholder: 'acme.atlassian.net',
        isSecret: false,
      },
      {
        id: 'email',
        labelKey: 'SETUP.FIELD_EMAIL',
        placeholder: 'you@acme.com',
        isSecret: false,
      },
      { id: 'token', labelKey: 'SETUP.FIELD_TOKEN', placeholder: '', isSecret: true },
    ],
  },
];

import type { IIntegrationStatus } from '@/shared/types';

const LANGUAGES: Record<string, string> = { en: 'English', pt: 'Brazilian Portuguese' };

/** Como o QAzinho está configurado, para um agente de fora, sem token nem segredo. */
export function describeSettings(props: {
  theme: 'dark' | 'light' | 'system';
  shownTheme: 'dark' | 'light';
  language: string;
  runAlert: 'system' | 'app';
  agent: string;
  integrations: IIntegrationStatus[];
}): string {
  const { theme, shownTheme, language, runAlert, agent, integrations } = props;
  const shown = shownTheme === 'dark' ? 'night (dark)' : 'paper (light)';
  const github = integrations.find(({ id }) => id === 'github');
  const jira = integrations.find(({ id }) => id === 'jira');

  return [
    theme === 'system' ? `Theme: the computer's, now ${shown}.` : `Theme: ${shown}.`,
    `Language: ${LANGUAGES[language] ?? language}.`,
    runAlert === 'system'
      ? 'A finished run calls the user back with a notification, a sound and a count on the icon.'
      : 'A finished run shows a notice inside QAzinho only.',
    `Their coding agent in QAzinho: ${agent}.`,
    github === undefined
      ? 'GitHub: not connected.'
      : `GitHub: connected as ${github.account}.`,
    jira === undefined
      ? 'Jira: not connected.'
      : `Jira: connected as ${jira.account}${jira.site === null ? '' : ` on ${jira.site}`}, Confluence ${jira.confluence === true ? 'on' : 'off'}.`,
  ].join('\n');
}

/**
 * Os comandos que o composer oferece depois de uma barra: um plano a partir do código, de
 * uma história do Jira ou de uma página do Confluence, ou contra um design do Figma.
 */
export type ChatCommandId =
  'code-plan' | 'jira-plan' | 'confluence-plan' | 'figma-plan' | 'import-plan';

/**
 * Os comandos que o composer oferece depois de uma barra: um plano a partir do código, de
 * uma história, de uma página, de um design ou de testes, ou uma skill que o QA chama.
 */
export type ChatCommandId =
  'code-plan' | 'jira-plan' | 'confluence-plan' | 'figma-plan' | 'import-plan' | 'skill';

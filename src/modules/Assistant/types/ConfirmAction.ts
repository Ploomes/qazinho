/** O que o assistente pediu para fazer e que o QA confirma na tela antes. */
export type ConfirmAction =
  | 'delete_workspace'
  | 'delete_project'
  | 'delete_variable'
  | 'disconnect_integration'
  | 'send_bug';

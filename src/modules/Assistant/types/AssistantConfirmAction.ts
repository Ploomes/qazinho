/** O que o próprio assistente só faz depois de o QA confirmar na tela. */
export type AssistantConfirmAction =
  | 'delete_workspace'
  | 'delete_project'
  | 'delete_variable'
  | 'disconnect_integration'
  | 'send_bug';

import type { AssistantConfirmAction } from './AssistantConfirmAction';

/** O que o assistente ou o agente de código do QA pediu e que o QA confirma na tela. */
export type ConfirmAction =
  | AssistantConfirmAction
  | 'update_project'
  | 'rename_workspace'
  | 'dismiss_bug'
  | 'update_cases'
  | 'delete_cases';

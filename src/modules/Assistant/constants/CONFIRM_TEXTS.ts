import type { ConfirmAction } from '@/modules/Assistant/types';
import type { ParseKeys } from 'i18next';

export const CONFIRM_TEXTS: Record<
  ConfirmAction,
  { title: ParseKeys; go: ParseKeys; gone: ParseKeys }
> = {
  delete_workspace: {
    title: 'ASSISTANT.CONFIRM_DELETE_WORKSPACE',
    go: 'ASSISTANT.DELETE',
    gone: 'ASSISTANT.DELETED',
  },
  delete_project: {
    title: 'ASSISTANT.CONFIRM_DELETE_PROJECT',
    go: 'ASSISTANT.DELETE',
    gone: 'ASSISTANT.DELETED',
  },
  delete_variable: {
    title: 'ASSISTANT.CONFIRM_DELETE_VARIABLE',
    go: 'ASSISTANT.DELETE',
    gone: 'ASSISTANT.DELETED',
  },
  disconnect_integration: {
    title: 'ASSISTANT.CONFIRM_DISCONNECT',
    go: 'ASSISTANT.DISCONNECT',
    gone: 'ASSISTANT.DISCONNECTED',
  },
};

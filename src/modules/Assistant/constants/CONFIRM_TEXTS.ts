import type { ConfirmAction } from '@/modules/Assistant/types';
import type { ButtonVariant } from '@/shared/components/atoms/Button/types';
import type { ParseKeys } from 'i18next';

export const CONFIRM_TEXTS: Record<
  ConfirmAction,
  { title: ParseKeys; go: ParseKeys; gone: ParseKeys; variant: ButtonVariant }
> = {
  delete_workspace: {
    title: 'ASSISTANT.CONFIRM_DELETE_WORKSPACE',
    go: 'ASSISTANT.DELETE',
    gone: 'ASSISTANT.DELETED',
    variant: 'danger',
  },
  delete_project: {
    title: 'ASSISTANT.CONFIRM_DELETE_PROJECT',
    go: 'ASSISTANT.DELETE',
    gone: 'ASSISTANT.DELETED',
    variant: 'danger',
  },
  delete_variable: {
    title: 'ASSISTANT.CONFIRM_DELETE_VARIABLE',
    go: 'ASSISTANT.DELETE',
    gone: 'ASSISTANT.DELETED',
    variant: 'danger',
  },
  disconnect_integration: {
    title: 'ASSISTANT.CONFIRM_DISCONNECT',
    go: 'ASSISTANT.DISCONNECT',
    gone: 'ASSISTANT.DISCONNECTED',
    variant: 'danger',
  },
  send_bug: {
    title: 'ASSISTANT.CONFIRM_SEND_BUG',
    go: 'ASSISTANT.SEND',
    gone: 'ASSISTANT.SENT',
    variant: 'primary',
  },
};

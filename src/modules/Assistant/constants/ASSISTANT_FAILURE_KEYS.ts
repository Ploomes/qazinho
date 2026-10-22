import type { ChatFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const ASSISTANT_FAILURE_KEYS: Record<
  Exclude<ChatFailure['reason'], 'stopped'>,
  ParseKeys
> = {
  'agent-missing': 'RUN.FAILED_AGENT_MISSING',
  'agent-signed-out': 'CHAT.FAILED_AGENT_SIGNED_OUT',
  'agent-error': 'CHAT.FAILED_AGENT_ERROR',
  'agent-silent': 'CHAT.FAILED_AGENT_SILENT',
  'no-emulator': 'ASSISTANT.FAILED_OTHER',
  'no-simulator': 'ASSISTANT.FAILED_OTHER',
  unreachable: 'ASSISTANT.FAILED_OTHER',
  code: 'ASSISTANT.FAILED_OTHER',
  jira: 'ASSISTANT.FAILED_OTHER',
  other: 'ASSISTANT.FAILED_OTHER',
};

import type { RunFailure } from '@/shared/types';

export const CHAT_FAILURE_KEYS = {
  'agent-missing': 'RUN.FAILED_AGENT_MISSING',
  'no-emulator': 'RUN.FAILED_NO_EMULATOR',
  'no-simulator': 'RUN.FAILED_NO_SIMULATOR',
  unreachable: 'RUN.FAILED_UNREACHABLE',
  'agent-signed-out': 'CHAT.FAILED_AGENT_SIGNED_OUT',
  'agent-error': 'CHAT.FAILED_AGENT_ERROR',
  'agent-silent': 'CHAT.FAILED_AGENT_SILENT',
  other: 'RUN.FAILED_OTHER',
} as const satisfies Record<RunFailure['reason'], string>;

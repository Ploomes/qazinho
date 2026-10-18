import type { RunFailure } from '@/shared/types';

export const RUN_FAILURE_KEYS = {
  'agent-missing': 'RUN.FAILED_AGENT_MISSING',
  'no-emulator': 'RUN.FAILED_NO_EMULATOR',
  'no-simulator': 'RUN.FAILED_NO_SIMULATOR',
  unreachable: 'RUN.FAILED_UNREACHABLE',
  'agent-error': 'RUN.FAILED_AGENT_ERROR',
  'agent-silent': 'RUN.FAILED_AGENT_SILENT',
  other: 'RUN.FAILED_OTHER',
} as const satisfies Record<RunFailure['reason'], string>;

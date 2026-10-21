import type { BuildFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const BUILD_FAILURE_KEYS: Record<BuildFailure['reason'], ParseKeys> = {
  'agent-missing': 'BUILD.FAILED_AGENT_MISSING',
  code: 'BUILD.FAILED_CODE',
  agent: 'BUILD.FAILED_AGENT',
  'no-artifact': 'BUILD.FAILED_NOTHING',
  stopped: 'BUILD.STOPPED',
};

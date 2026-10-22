import type { SuiteShipOutcome } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const SUITE_CHANGE_REVIEW = {
  width: 900,
  height: 720,
  failureKeys: {
    commit: 'AUTOMATION.SHIP_FAILED_COMMIT',
    push: 'AUTOMATION.SHIP_FAILED_PUSH',
    'pull-request': 'AUTOMATION.SHIP_FAILED_PULL_REQUEST',
  } satisfies Record<Extract<SuiteShipOutcome, { isOk: false }>['step'], ParseKeys>,
} as const;

import type { SuiteTestState } from '@/modules/Automation/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ParseKeys } from 'i18next';

export const SUITE_TEST_STATES: Record<
  SuiteTestState,
  {
    icon: IconName;
    tone: 'lime' | 'pass' | 'fail' | 'attn' | 'quiet';
    labelKey: ParseKeys;
  }
> = {
  running: { icon: 'running', tone: 'lime', labelKey: 'STATUS.RUNNING' },
  passed: { icon: 'passed', tone: 'pass', labelKey: 'STATUS.PASSED' },
  failed: { icon: 'failed', tone: 'fail', labelKey: 'STATUS.FAILED' },
  flaky: { icon: 'attention', tone: 'attn', labelKey: 'AUTOMATION.FLAKY' },
  skipped: { icon: 'skipped', tone: 'quiet', labelKey: 'STATUS.SKIPPED' },
  pending: { icon: 'pending', tone: 'quiet', labelKey: 'STATUS.NOT_RUN' },
};

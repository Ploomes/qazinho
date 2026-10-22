import type { SuiteResultState } from '@/modules/Automation/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ParseKeys } from 'i18next';

export const SUITE_RESULT_STATES: Record<
  SuiteResultState,
  {
    icon: IconName;
    tone: 'pass' | 'fail' | 'attn' | 'quiet';
    labelKey: ParseKeys;
  }
> = {
  passed: { icon: 'passed', tone: 'pass', labelKey: 'STATUS.PASSED' },
  flaky: { icon: 'attention', tone: 'attn', labelKey: 'AUTOMATION.FLAKY' },
  failed: { icon: 'failed', tone: 'fail', labelKey: 'STATUS.FAILED' },
  timedOut: { icon: 'timedOut', tone: 'fail', labelKey: 'AUTOMATION.TIMED_OUT' },
  interrupted: { icon: 'stopped', tone: 'quiet', labelKey: 'AUTOMATION.INTERRUPTED' },
  skipped: { icon: 'skipped', tone: 'quiet', labelKey: 'STATUS.SKIPPED' },
};

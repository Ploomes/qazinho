import type { ISuiteResult } from '@/modules/Automation/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ParseKeys } from 'i18next';

/** How QAzinho's own run of a fixed test reads: it passes in the copy, it still fails, or it could not run again. */
export function checkLookOf(check: ISuiteResult | null): {
  icon: IconName;
  tone: 'pass' | 'fail' | 'attn';
  labelKey: ParseKeys;
} {
  if (check === null)
    return { icon: 'attention', tone: 'attn', labelKey: 'AUTOMATION.CHANGE_CHECK_NONE' };

  return check.status === 'passed'
    ? { icon: 'passed', tone: 'pass', labelKey: 'AUTOMATION.CHANGE_CHECK_PASSED' }
    : { icon: 'failed', tone: 'fail', labelKey: 'AUTOMATION.CHANGE_CHECK_FAILED' };
}

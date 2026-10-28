import type { ISuiteResult } from '@/modules/Automation/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { ParseKeys } from 'i18next';

/**
 * Como se lê a run própria do QAzinho dos testes de que uma mudança trata: passam na
 * cópia, alguns falham, ou nenhum pôde rodar, com quantos havia e quantos falharam.
 */
export function checkLookOf(checks: ISuiteResult[]): {
  icon: IconName;
  tone: 'pass' | 'fail' | 'attn';
  labelKey: ParseKeys;
  count: number;
  failed: number;
} {
  const count = checks.length;
  const failed = checks.filter(({ status }) => status !== 'passed').length;

  if (count === 0)
    return {
      icon: 'attention',
      tone: 'attn',
      labelKey: 'AUTOMATION.CHANGE_CHECK_NONE',
      count,
      failed,
    };

  if (failed === 0)
    return {
      icon: 'passed',
      tone: 'pass',
      labelKey:
        count === 1
          ? 'AUTOMATION.CHANGE_CHECK_PASSED'
          : 'AUTOMATION.CHANGE_CHECKS_PASSED',
      count,
      failed,
    };

  return {
    icon: 'failed',
    tone: 'fail',
    labelKey:
      count === 1 ? 'AUTOMATION.CHANGE_CHECK_FAILED' : 'AUTOMATION.CHANGE_CHECKS_FAILED',
    count,
    failed,
  };
}

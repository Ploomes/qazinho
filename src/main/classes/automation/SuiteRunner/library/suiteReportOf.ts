import type { SuiteReport } from '@/main/classes/automation/SuiteRunner/types';
import {
  SUITE_REPORT,
  SUITE_REPORTER,
} from '@/main/classes/automation/SuiteRunner/constants';

/**
 * Uma linha que o reporter do QAzinho imprimiu, lida de volta; null para qualquer outra
 * linha que uma suíte imprime, ou uma que não está inteira.
 */
export function suiteReportOf(line: string): SuiteReport | null {
  if (!line.startsWith(SUITE_REPORTER.prefix)) return null;

  try {
    const read = SUITE_REPORT.safeParse(
      JSON.parse(line.slice(SUITE_REPORTER.prefix.length)),
    );

    return read.success ? read.data : null;
  } catch {
    return null;
  }
}

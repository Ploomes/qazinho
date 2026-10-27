import type { SuiteReport } from '@/main/classes/automation/SuiteRunner/types';
import {
  SUITE_REPORT,
  SUITE_REPORTER,
} from '@/main/classes/automation/SuiteRunner/constants';

/**
 * A line QAzinho's reporter printed, read back; null for any other line a suite prints,
 * or one that is not whole.
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

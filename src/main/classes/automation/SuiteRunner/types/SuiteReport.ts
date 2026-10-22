import type { SUITE_REPORT } from '@/main/classes/automation/SuiteRunner/constants';
import type { z } from 'zod';

/** One line QAzinho's reporter prints while a suite runs, read back. */
export type SuiteReport = z.infer<typeof SUITE_REPORT>;

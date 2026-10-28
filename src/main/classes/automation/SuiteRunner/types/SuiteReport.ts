import type { SUITE_REPORT } from '@/main/classes/automation/SuiteRunner/constants';
import type { z } from 'zod';

/** Uma linha que o reporter do QAzinho imprime enquanto uma suíte roda, lida de volta. */
export type SuiteReport = z.infer<typeof SUITE_REPORT>;

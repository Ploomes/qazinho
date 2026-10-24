import { z } from 'zod';
import { SYNC_CASE_SCHEMA } from '@/main/classes/pro/ProApi/constants';

export const PLAN_CONFLICT_SCHEMA = z.object({
  version: z.number(),
  cases: z.array(SYNC_CASE_SCHEMA),
  editedBy: z.string().nullable(),
  editedAt: z.string(),
});

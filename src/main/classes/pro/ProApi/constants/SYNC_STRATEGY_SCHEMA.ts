import { z } from 'zod';

export const SYNC_STRATEGY_SCHEMA = z.object({
  covers: z.string(),
  leavesOut: z.string(),
  where: z.string(),
  data: z.string(),
  risks: z.string(),
});

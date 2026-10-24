import { z } from 'zod';

export const SYNC_PLAN_SCHEMA = z.object({
  plan: z.object({ id: z.string(), version: z.number() }),
});

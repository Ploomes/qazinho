import { z } from 'zod';

export const SYNC_BUG_SCHEMA = z.object({
  bug: z.object({ id: z.string(), label: z.string() }),
});

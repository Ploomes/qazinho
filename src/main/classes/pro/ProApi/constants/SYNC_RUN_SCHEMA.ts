import { z } from 'zod';

export const SYNC_RUN_SCHEMA = z.object({
  run: z.object({ id: z.string(), number: z.number() }),
});

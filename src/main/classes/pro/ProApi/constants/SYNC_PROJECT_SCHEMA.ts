import { z } from 'zod';

export const SYNC_PROJECT_SCHEMA = z.object({
  project: z.object({ id: z.string(), key: z.string(), name: z.string() }),
});

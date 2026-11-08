import { z } from 'zod';
import { SYNC_MEMORY_SCHEMA } from './SYNC_MEMORY_SCHEMA';

export const SYNC_MEMORIES_SCHEMA = z.object({
  memories: z.array(SYNC_MEMORY_SCHEMA),
});

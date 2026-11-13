import { z } from 'zod';

export const SYNC_CASE_SCHEMA = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(['P1', 'P2', 'P3']),
  goal: z.string(),
  preconditions: z.string(),
  steps: z.array(
    z.object({ action: z.string(), expected: z.string(), frame: z.string().optional() }),
  ),
  isManual: z.boolean().optional(),
});

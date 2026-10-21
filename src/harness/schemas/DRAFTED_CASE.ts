import { z } from 'zod';

export const DRAFTED_CASE = z.object({
  id: z
    .string()
    .describe(
      'The id of the case this one keeps or changes, such as TC-03; none for a new case.',
    )
    .optional(),
  title: z.string(),
  priority: z.enum(['P1', 'P2', 'P3']),
  goal: z.string(),
  preconditions: z.string(),
  steps: z.array(z.object({ action: z.string(), expected: z.string() })),
});

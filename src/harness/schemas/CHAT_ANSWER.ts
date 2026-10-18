import { z } from 'zod';

const STEP = z.object({ action: z.string(), expected: z.string() });

const CASE = z.object({
  title: z.string(),
  priority: z.enum(['P1', 'P2', 'P3']),
  goal: z.string(),
  preconditions: z.string(),
  steps: z.array(STEP),
});

export const CHAT_ANSWER = z.object({
  reply: z.string(),
  plan: z.object({ summary: z.string(), cases: z.array(CASE) }).optional(),
});

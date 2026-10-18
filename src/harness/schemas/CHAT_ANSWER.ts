import { z } from 'zod';

const STEP = z.object({ action: z.string(), expected: z.string() });

const CASE = z.object({
  title: z.string(),
  priority: z.enum(['P1', 'P2', 'P3']),
  goal: z.string(),
  preconditions: z.string(),
  steps: z.array(STEP),
});

const OPTION = z.object({ label: z.string(), description: z.string() });

const QUESTION = z.object({
  header: z.string(),
  question: z.string(),
  options: z.array(OPTION).min(1).max(4),
  multiSelect: z.boolean(),
});

export const CHAT_ANSWER = z.object({
  reply: z.string(),
  questions: z.array(QUESTION).optional(),
  plan: z.object({ summary: z.string(), cases: z.array(CASE) }).optional(),
});

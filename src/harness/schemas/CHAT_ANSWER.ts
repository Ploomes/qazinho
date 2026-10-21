import { z } from 'zod';
import { DRAFTED_CASE } from './DRAFTED_CASE';

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
  plan: z.object({ summary: z.string(), cases: z.array(DRAFTED_CASE) }).optional(),
});

import { z } from 'zod';

export const SYNC_DOUBT_SCHEMA = z.object({
  id: z.string(),
  question: z.string(),
  sent: z.object({ url: z.string(), at: z.string() }).nullable(),
  answer: z.object({ text: z.string(), by: z.string(), at: z.string() }).nullable(),
});

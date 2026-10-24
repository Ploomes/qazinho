import { z } from 'zod';

export const PRO_USER_SCHEMA = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
});

import { z } from 'zod';

export const PRO_ORG_SCHEMA = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.enum(['owner', 'admin', 'editor', 'reader']),
  billingStatus: z.enum(['trialing', 'active', 'past_due', 'blocked', 'canceled']),
});

import { z } from 'zod';
import { PRO_ORG_SCHEMA } from '@/main/classes/pro/ProApi/constants';

export const STORED_PRO_SCHEMA = z.object({
  token: z.string().min(1),
  machine: z.object({ id: z.string(), name: z.string() }),
  account: z.object({ email: z.string(), name: z.string().nullable() }),
  orgs: z.array(PRO_ORG_SCHEMA),
});

import { z } from 'zod';
import { PRO_ORG_SCHEMA } from './PRO_ORG_SCHEMA';
import { PRO_USER_SCHEMA } from './PRO_USER_SCHEMA';

export const DEVICE_TOKEN_SCHEMA = z.object({
  token: z.string(),
  machine: z.object({ id: z.string(), name: z.string() }),
  user: PRO_USER_SCHEMA,
  orgs: z.array(PRO_ORG_SCHEMA),
});

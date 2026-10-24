import { z } from 'zod';
import { PRO_ORG_SCHEMA } from './PRO_ORG_SCHEMA';
import { PRO_USER_SCHEMA } from './PRO_USER_SCHEMA';

export const ME_SCHEMA = z.object({
  user: PRO_USER_SCHEMA,
  orgs: z.array(PRO_ORG_SCHEMA),
});

import { z } from 'zod';
import { ORG_TEMPLATE_SCHEMA } from './ORG_TEMPLATE_SCHEMA';

export const ORG_TEMPLATES_SCHEMA = z.object({
  templates: z.array(ORG_TEMPLATE_SCHEMA),
  canPublish: z.boolean(),
  canSetDefault: z.boolean(),
});

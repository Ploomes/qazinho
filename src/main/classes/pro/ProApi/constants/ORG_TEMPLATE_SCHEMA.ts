import { z } from 'zod';

export const ORG_TEMPLATE_SCHEMA = z.object({
  id: z.string(),
  kind: z.enum(['bug', 'plan', 'doubts', 'decisions']),
  name: z.string(),
  title: z.string(),
  parts: z.array(
    z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('section'), field: z.string(), heading: z.string() }),
      z.object({ kind: z.literal('text'), text: z.string() }),
    ]),
  ),
  cases: z.enum(['steps', 'gherkin']),
  isDefault: z.boolean(),
  author: z.object({ id: z.string().nullable(), name: z.string().nullable() }),
  updatedAt: z.string(),
});

import { z } from 'zod';

export const SUITE_REPORT = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('begin'), total: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('test-begin'), id: z.string(), retry: z.number() }),
  z.object({ kind: z.literal('step'), id: z.string(), title: z.string() }),
  z.object({
    kind: z.literal('test-end'),
    id: z.string(),
    title: z.string(),
    file: z.string(),
    line: z.number(),
    project: z.string(),
    status: z.enum(['passed', 'failed', 'timedOut', 'skipped', 'interrupted']),
    outcome: z.string(),
    retry: z.number(),
    durationMs: z.number(),
    error: z.string().nullable(),
    attachments: z.array(
      z.object({ name: z.string(), contentType: z.string(), path: z.string() }),
    ),
  }),
  z.object({ kind: z.literal('error'), message: z.string() }),
  z.object({ kind: z.literal('end'), status: z.string() }),
]);

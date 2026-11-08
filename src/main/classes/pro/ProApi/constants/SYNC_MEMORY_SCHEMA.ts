import { z } from 'zod';

export const SYNC_MEMORY_SCHEMA = z.object({
  id: z.string(),
  text: z.string(),
  scope: z.enum(['project', 'plan']),
  workspaceId: z.string().nullable(),
  target: z.enum(['all', 'web', 'android', 'ios']),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

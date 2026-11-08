import { z } from 'zod';
import { SYNC_CASE_SCHEMA } from '@/main/classes/pro/ProApi/constants';

export const SYNC_RECORD_SCHEMA = z.object({
  orgSlug: z.string(),
  state: z.enum([
    'off',
    'synced',
    'sending',
    'waiting',
    'conflict',
    'blocked',
    'read-only',
    'signed-out',
    'gone',
    'no-access',
    'failed',
  ]),
  syncedAt: z.string().nullable(),
  mediaFrom: z.string().nullable().default(null),
  pending: z.array(z.string()).default([]),
  conflicts: z.array(
    z.object({
      workspaceId: z.string(),
      base: z.array(SYNC_CASE_SCHEMA),
      version: z.number(),
      cases: z.array(SYNC_CASE_SCHEMA),
      editedBy: z.string().nullable(),
      editedAt: z.string(),
    }),
  ),
  project: z.string().nullable(),
  memories: z.string().nullable().default(null),
  plans: z.record(
    z.string(),
    z.object({
      planId: z.string().nullable(),
      version: z.number(),
      hash: z.string(),
      cases: z.array(SYNC_CASE_SCHEMA),
    }),
  ),
  runs: z.record(z.string(), z.string()),
  bugs: z.record(z.string(), z.string()),
  recordings: z.record(z.string(), z.string()),
  evidence: z.record(z.string(), z.string()),
});

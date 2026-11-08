import { z } from 'zod';
import { SYNC_CASE_SCHEMA } from './SYNC_CASE_SCHEMA';
import { SYNC_MEMORY_SCHEMA } from './SYNC_MEMORY_SCHEMA';

export const SYNCED_PROJECTS_SCHEMA = z.object({
  projects: z.array(
    z.object({
      id: z.string(),
      desktopId: z.string(),
      key: z.string(),
      name: z.string(),
      targets: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(['web', 'android', 'ios']),
          label: z.string(),
          value: z.string(),
        }),
      ),
      repositories: z.array(
        z.object({
          id: z.string(),
          owner: z.string(),
          name: z.string(),
          baseBranch: z.string(),
        }),
      ),
      variables: z.array(z.object({ name: z.string(), description: z.string() })),
      memories: z.array(SYNC_MEMORY_SCHEMA).default([]),
      plans: z.array(
        z.object({
          id: z.string(),
          desktopId: z.string(),
          name: z.string(),
          version: z.number(),
          targetId: z.string().nullish(),
          targetKind: z.enum(['web', 'android', 'ios']).nullish(),
          issue: z
            .object({
              key: z.string(),
              title: z.string(),
              source: z.string(),
              url: z.string(),
            })
            .nullish(),
          design: z
            .object({
              url: z.string(),
              fileKey: z.string(),
              nodeId: z.string().nullable(),
              name: z.string(),
            })
            .nullish(),
          cases: z.array(SYNC_CASE_SCHEMA),
          editedBy: z.string().nullish(),
          editedAt: z.string().nullish(),
        }),
      ),
    }),
  ),
});

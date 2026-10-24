import { z } from 'zod';

export const RECORDINGS_SCHEMA = z.object({
  branch: z.string(),
  recordings: z.array(
    z.object({
      caseId: z.string(),
      fingerprint: z.string(),
      targetKind: z.enum(['web', 'android', 'ios']),
      steps: z.array(z.unknown()),
      recordedAt: z.string(),
    }),
  ),
});

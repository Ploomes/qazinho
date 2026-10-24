import { z } from 'zod';

export const EVIDENCE_UPLOAD_SCHEMA = z.object({
  key: z.string(),
  uploadUrl: z.string(),
  headers: z.record(z.string(), z.string()),
});

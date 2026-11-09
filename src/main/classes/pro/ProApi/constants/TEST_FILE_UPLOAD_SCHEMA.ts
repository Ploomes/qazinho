import { z } from 'zod';

export const TEST_FILE_UPLOAD_SCHEMA = z.object({
  key: z.string(),
  isKept: z.boolean(),
  uploadUrl: z.string().nullable(),
  headers: z.record(z.string(), z.string()),
});

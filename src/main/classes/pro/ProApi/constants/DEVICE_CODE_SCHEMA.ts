import { z } from 'zod';

export const DEVICE_CODE_SCHEMA = z.object({
  deviceCode: z.string(),
  userCode: z.string(),
  verificationUrl: z.string(),
  expiresIn: z.number(),
  interval: z.number(),
});

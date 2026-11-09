import { MEMORY_LIMIT } from '@/shared/constants';

export const MEMORY = {
  shown: MEMORY_LIMIT.project + MEMORY_LIMIT.plan,
  minChars: 12,
} as const;

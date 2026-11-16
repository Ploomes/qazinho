import type { UsageKind } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const USAGE_KIND_LABELS: Record<UsageKind, ParseKeys> = {
  chat: 'USAGE_SCREEN.KIND_CHAT',
  case: 'USAGE_SCREEN.KIND_CASE',
  explore: 'USAGE_SCREEN.KIND_EXPLORE',
  prepare: 'USAGE_SCREEN.KIND_PREPARE',
  'sign-in': 'USAGE_SCREEN.KIND_SIGN_IN',
  assistant: 'USAGE_SCREEN.KIND_ASSISTANT',
  memory: 'USAGE_SCREEN.KIND_MEMORY',
  change: 'USAGE_SCREEN.KIND_CHANGE',
  build: 'USAGE_SCREEN.KIND_BUILD',
  review: 'USAGE_SCREEN.KIND_REVIEW',
  skill: 'USAGE_SCREEN.KIND_SKILL',
};

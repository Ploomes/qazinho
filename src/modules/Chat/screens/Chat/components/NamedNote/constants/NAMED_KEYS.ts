import type { NameOrigin } from '@/modules/Project/types';
import type { ParseKeys } from 'i18next';

export const NAMED_KEYS = {
  site: 'CHAT.NAMED_SITE',
  build: 'CHAT.NAMED_BUILD',
  code: 'CHAT.NAMED_CODE',
  agent: 'CHAT.NAMED_AGENT',
} as const satisfies Record<NameOrigin, ParseKeys>;

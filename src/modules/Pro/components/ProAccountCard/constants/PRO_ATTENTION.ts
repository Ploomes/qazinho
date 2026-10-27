import type { ProAttention } from '@/modules/Pro/types';
import type { ParseKeys } from 'i18next';

export const PRO_ATTENTION: Record<ProAttention, ParseKeys> = {
  unreachable: 'PRO.ATTENTION_UNREACHABLE',
  'no-org': 'PRO.ATTENTION_NO_ORG',
  reader: 'PRO.ATTENTION_READER',
  blocked: 'PRO.ATTENTION_BLOCKED',
  'read-only': 'PRO.ATTENTION_READ_ONLY',
  'signed-out': 'PRO.ATTENTION_SIGNED_OUT',
  gone: 'PRO.ATTENTION_GONE',
  'no-access': 'PRO.ATTENTION_NO_ACCESS',
  failed: 'PRO.ATTENTION_FAILED',
};

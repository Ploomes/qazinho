import type { ProRemoval } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const DELETE_ORG_FAILURES: Record<
  Extract<ProRemoval, { isRemoved: false }>['failure'],
  ParseKeys
> = {
  busy: 'PROJECT.DELETE_ORG_BUSY',
  forbidden: 'PROJECT.DELETE_ORG_FORBIDDEN',
  unreachable: 'PROJECT.DELETE_ORG_UNREACHABLE',
  'signed-out': 'PROJECT.DELETE_ORG_SIGNED_OUT',
  failed: 'PROJECT.DELETE_ORG_FAILED',
};

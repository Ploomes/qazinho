import type { OrgTemplateFailure } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const ORG_TEMPLATE_FAILURE_KEYS: Record<OrgTemplateFailure, ParseKeys> = {
  'signed-out': 'TEMPLATES.ORG_SIGNED_OUT',
  unreachable: 'TEMPLATES.ORG_UNREACHABLE',
  forbidden: 'TEMPLATES.ORG_FORBIDDEN',
  failed: 'TEMPLATES.ORG_FAILED',
};

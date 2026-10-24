import type { ProRole } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const PRO_ROLES: Record<ProRole, ParseKeys> = {
  owner: 'PRO.ROLE_OWNER',
  admin: 'PRO.ROLE_ADMIN',
  editor: 'PRO.ROLE_EDITOR',
  reader: 'PRO.ROLE_READER',
};

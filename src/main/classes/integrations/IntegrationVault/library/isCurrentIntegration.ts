import type { IStoredIntegration } from '@/main/classes/integrations/IntegrationVault/types';

/**
 * Whether a stored connection still counts: GitHub connected with a pasted token, before
 * gh, does not.
 */
export function isCurrentIntegration(stored: IStoredIntegration): boolean {
  return stored.status.id !== 'github' || !Object.hasOwn(stored.credentials, 'token');
}

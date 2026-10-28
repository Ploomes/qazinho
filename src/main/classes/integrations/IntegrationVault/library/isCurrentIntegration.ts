import type { IStoredIntegration } from '@/main/classes/integrations/IntegrationVault/types';

/**
 * Se uma conexão guardada ainda vale: o GitHub conectado com um token colado, antes do
 * gh, não vale.
 */
export function isCurrentIntegration(stored: IStoredIntegration): boolean {
  return stored.status.id !== 'github' || !Object.hasOwn(stored.credentials, 'token');
}

import type { IConnectIntegration, IIntegrationStatus } from '@/shared/types';

/**
 * Um tracker conectado como está no disco, lacrado: o que a página vê, mais o que foi
 * digitado para obtê-lo.
 */
export interface IStoredIntegration {
  status: IIntegrationStatus;
  credentials: IConnectIntegration;
}

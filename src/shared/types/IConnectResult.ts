import type { ConnectFailure } from './ConnectFailure';
import type { IIntegrationStatus } from './IIntegrationStatus';

/** Se o tracker aceitou as credenciais, e por que não quando não aceitou. */
export type IConnectResult =
  | { isConnected: true; status: IIntegrationStatus }
  | { isConnected: false; failure: ConnectFailure };

import type { ConnectFailure } from './ConnectFailure';
import type { IIntegrationStatus } from './IIntegrationStatus';

/** Whether the tracker took the credentials, and why not when it did not. */
export type IConnectResult =
  | { isConnected: true; status: IIntegrationStatus }
  | { isConnected: false; failure: ConnectFailure };

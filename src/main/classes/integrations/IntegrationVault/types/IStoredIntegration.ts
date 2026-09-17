import type { IConnectIntegration, IIntegrationStatus } from '@/types';

/** A connected tracker as it sits on disk, sealed: what the page sees, plus what was typed to get it. */
export interface IStoredIntegration {
  status: IIntegrationStatus;
  credentials: IConnectIntegration;
}

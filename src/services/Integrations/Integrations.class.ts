import type {
  IConnectIntegration,
  IConnectResult,
  IIntegrationStatus,
  IntegrationId,
} from '@/types';
import { NO_CONNECTION } from './constants';

/** The only caller of the tracker side of the bridge. Tokens go in; only accounts come back. */
export class Integrations {
  public static async list(): Promise<IIntegrationStatus[]> {
    return (await window.gocrash?.listIntegrations()) ?? [];
  }

  public static async connect(connecting: IConnectIntegration): Promise<IConnectResult> {
    return (await window.gocrash?.connectIntegration(connecting)) ?? NO_CONNECTION;
  }

  public static async disconnect(id: IntegrationId): Promise<void> {
    await window.gocrash?.disconnectIntegration(id);
  }
}

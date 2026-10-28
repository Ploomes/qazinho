import type {
  IConnectIntegration,
  IConnectResult,
  IIntegrationStatus,
  IntegrationId,
} from '@/shared/types';

/** O único que chama o lado dos trackers da bridge. Tokens entram; só contas voltam. */
export class Integrations {
  public static async list(): Promise<IIntegrationStatus[]> {
    return (await window.qazinho?.listIntegrations()) ?? [];
  }

  public static async connect(connecting: IConnectIntegration): Promise<IConnectResult> {
    return (
      (await window.qazinho?.connectIntegration(connecting)) ?? {
        isConnected: false,
        failure: { reason: 'no-bridge' },
      }
    );
  }

  public static async disconnect(id: IntegrationId): Promise<void> {
    await window.qazinho?.disconnectIntegration(id);
  }
}

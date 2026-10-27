import type {
  IConnectIntegration,
  IConnectResult,
  IIntegrationStatus,
  IntegrationId,
} from '@/shared/types';

/**
 * The only caller of the tracker side of the bridge. Tokens go in; only accounts come
 * back.
 */
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

import type { AttachOutcome } from '@/shared/types';

/** O único que chama os anexos do chat na bridge: escolhidos no disco ou colados. */
export class Attachments {
  public static async pick(workspaceId: string): Promise<AttachOutcome> {
    return (
      (await window.qazinho?.pickAttachments(workspaceId)) ?? {
        isAttached: false,
        failure: { reason: 'no-bridge' },
      }
    );
  }

  public static async add(props: {
    workspaceId: string;
    name: string;
    data: Uint8Array;
  }): Promise<AttachOutcome> {
    return (
      (await window.qazinho?.attachData(props)) ?? {
        isAttached: false,
        failure: { reason: 'no-bridge' },
      }
    );
  }
}

import type { IChatDevices, IOpenChatDevice } from './types';
import type { IVariableValue } from '@/main/types';
import type { IViewport } from '@/shared/types';
import type { IDevicePort } from '@ploomes/qazinho-harness';
import { join } from 'node:path';
import { privateUrlOf, variablePort } from '@/main/classes/runs/RunCoordinator/library';
import { CHAT_DEVICES } from './constants';

/**
 * O navegador do QAzinho em que o agente do chat conhece o app antes de planejar: um por
 * workspace, transmitido na aba Dispositivo, mantido entre mensagens e fechado parado.
 */
export class ChatDevices {
  private readonly props: IChatDevices;
  private readonly open = new Map<string, IOpenChatDevice>();

  public constructor(props: IChatDevices) {
    this.props = props;
  }

  /** O navegador do chat de um workspace no app, aberto agora ou o que já estava. */
  public async ready(props: {
    workspaceId: string;
    url: string;
    values: IVariableValue[];
    viewport: IViewport;
  }): Promise<IDevicePort> {
    const { workspaceId, url, values, viewport } = props;
    const kept = this.open.get(workspaceId);

    if (kept !== undefined && kept.url === url) {
      if (kept.timer !== null) clearTimeout(kept.timer);
      kept.timer = null;

      return variablePort({ device: kept.driver, values });
    }

    if (kept !== undefined) await this.close(workspaceId);

    const stream = `${CHAT_DEVICES.streamPrefix}${workspaceId}`;
    const entry: IOpenChatDevice = {
      driver: this.props.openDriver({
        url,
        profileDir: join(
          this.props.profilesRoot,
          `${CHAT_DEVICES.profilePrefix}${workspaceId}`,
        ),
        viewport,
        values,
        onAddress: (address) => {
          entry.address = privateUrlOf({ url: address, values });
          this.tell(workspaceId);
        },
      }),
      url,
      streamUrl: null,
      address: null,
      timer: null,
    };

    this.open.set(workspaceId, entry);
    await entry.driver.open();

    const isStreaming = await entry.driver.stream((jpeg, screen) => {
      if (screen !== undefined) return;

      this.props.live.push({
        workspaceId: stream,
        jpeg,
        ratio: viewport.width / viewport.height,
      });
    });

    entry.streamUrl = isStreaming ? this.props.live.urlFor(stream) : null;
    this.tell(workspaceId);

    return variablePort({ device: entry.driver, values });
  }

  /** Deixa o navegador aberto para a próxima mensagem, e o fecha se ninguém volta. */
  public release(workspaceId: string): void {
    const kept = this.open.get(workspaceId);

    if (kept === undefined) return;

    if (kept.timer !== null) clearTimeout(kept.timer);
    kept.timer = setTimeout(() => {
      void this.close(workspaceId);
    }, this.props.idleMs ?? CHAT_DEVICES.idleMs);
  }

  /** Fecha o navegador do chat de um workspace, antes de uma run ou quando ele se vai. */
  public async close(workspaceId: string): Promise<void> {
    const kept = this.open.get(workspaceId);

    if (kept === undefined) return;

    this.open.delete(workspaceId);

    if (kept.timer !== null) clearTimeout(kept.timer);

    await kept.driver.close().catch(() => undefined);
    this.props.live.end(`${CHAT_DEVICES.streamPrefix}${workspaceId}`);
    this.props.onChange({ workspaceId, streamUrl: null, address: null });
  }

  /** Fecha todo navegador do chat, quando o app sai. */
  public async closeAll(): Promise<void> {
    await Promise.all(
      [...this.open.keys()].map((workspaceId) => this.close(workspaceId)),
    );
  }

  private tell(workspaceId: string): void {
    const kept = this.open.get(workspaceId);

    if (kept === undefined) return;

    this.props.onChange({
      workspaceId,
      streamUrl: kept.streamUrl,
      address: kept.address,
    });
  }
}

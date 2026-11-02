import type {
  IAppToolAnswer,
  IOutsideAgent,
  IOutsideServer,
  IOutsideToolRequest,
  McpActionResult,
} from '@/shared/types';

/**
 * O único que chama o lado dos agentes de fora da bridge: a porta deles, e as chamadas
 * que chegam por ela.
 */
export class Outside {
  public static async server(): Promise<IOutsideServer> {
    return (await window.qazinho?.outsideServer()) ?? { isOn: false, isBusy: false };
  }

  public static async agents(): Promise<IOutsideAgent[]> {
    return (await window.qazinho?.outsideAgents()) ?? [];
  }

  public static async turn(isOn: boolean): Promise<IOutsideServer> {
    return (
      (await window.qazinho?.turnOutsideServer(isOn)) ?? { isOn: false, isBusy: false }
    );
  }

  public static async renew(): Promise<IOutsideServer> {
    return (await window.qazinho?.renewOutsideServer()) ?? { isOn: false, isBusy: false };
  }

  public static async add(agentId: string): Promise<McpActionResult> {
    return (
      (await window.qazinho?.addOutsideAgent(agentId)) ?? {
        ok: false,
        error: 'QAzinho is not ready yet.',
      }
    );
  }

  public static async remove(agentId: string): Promise<McpActionResult> {
    return (
      (await window.qazinho?.removeOutsideAgent(agentId)) ?? {
        ok: false,
        error: 'QAzinho is not ready yet.',
      }
    );
  }

  public static async copyAddress(): Promise<boolean> {
    return (await window.qazinho?.copyOutsideAddress()) ?? false;
  }

  public static onCall(listener: (request: IOutsideToolRequest) => void): () => void {
    return window.qazinho?.onOutsideToolCall(listener) ?? (() => undefined);
  }

  public static answer(answer: IAppToolAnswer): void {
    window.qazinho?.answerAppTool(answer);
  }
}

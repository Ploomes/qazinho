import type {
  IAgentEvent,
  IAppToolAnswer,
  IAppToolRequest,
  IAssistantAsk,
  IAssistantTurn,
} from '@/shared/types';
import { i18n } from '@/languages';

/**
 * The only caller of the assistant side of the bridge: its asks, its events, and the app
 * tool calls the page carries out.
 */
export class Assistant {
  public static async ask(ask: IAssistantAsk): Promise<IAssistantTurn> {
    return (
      (await window.qazinho?.askAssistant(ask)) ?? {
        sessionId: null,
        text: i18n.t('COMMON.NO_BRIDGE'),
        usage: null,
        costUsd: null,
        isError: true,
        failure: null,
      }
    );
  }

  public static async stop(): Promise<void> {
    await window.qazinho?.stopAssistant();
  }

  public static onEvent(listener: (event: IAgentEvent) => void): () => void {
    return window.qazinho?.onAssistantEvent(listener) ?? (() => undefined);
  }

  public static onToolCall(listener: (request: IAppToolRequest) => void): () => void {
    return window.qazinho?.onAppToolCall(listener) ?? (() => undefined);
  }

  public static answer(answer: IAppToolAnswer): void {
    window.qazinho?.answerAppTool(answer);
  }
}

import type { IAgentEvent, IAskAgent, IChatTurn } from '@/shared/types';
import { NO_BRIDGE } from './constants';

/** The only caller of the agent side of the bridge. */
export class Agent {
  public static async ask(ask: IAskAgent): Promise<IChatTurn> {
    return (await window.qazinho?.askAgent(ask)) ?? NO_BRIDGE;
  }

  public static onEvent(listener: (event: IAgentEvent) => void): () => void {
    return window.qazinho?.onAgentEvent(listener) ?? (() => undefined);
  }
}

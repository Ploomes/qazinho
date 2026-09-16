import type { IAgentEvent, IAgentTurn, IAskAgent } from '@/types';

const NO_BRIDGE: IAgentTurn = {
  sessionId: null,
  text: 'gocrash is not talking to the machine. Restart the app.',
  usage: null,
  isError: true,
};

/** The only caller of the agent side of the bridge. */
export class Agent {
  public static async ask(ask: IAskAgent): Promise<IAgentTurn> {
    return (await window.gocrash?.askAgent(ask)) ?? NO_BRIDGE;
  }

  public static onEvent(listener: (event: IAgentEvent) => void): () => void {
    return window.gocrash?.onAgentEvent(listener) ?? (() => undefined);
  }
}

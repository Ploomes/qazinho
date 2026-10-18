import type {
  AgentSignInProgress,
  IAgentEvent,
  IAskAgent,
  IChatTurn,
} from '@/shared/types';
import { NO_BRIDGE } from './constants';

/** The only caller of the agent side of the bridge. */
export class Agent {
  public static async ask(ask: IAskAgent): Promise<IChatTurn> {
    return (await window.qazinho?.askAgent(ask)) ?? NO_BRIDGE;
  }

  public static onEvent(listener: (event: IAgentEvent) => void): () => void {
    return window.qazinho?.onAgentEvent(listener) ?? (() => undefined);
  }

  public static async signIn(agentId: string): Promise<AgentSignInProgress> {
    return (
      (await window.qazinho?.signInAgent(agentId)) ?? {
        agentId,
        steps: ['start', 'browser'],
        takesCode: false,
        phase: 'failed',
        at: 'start',
        failure: 'unsupported',
        said: '',
      }
    );
  }

  public static async cancelSignIn(agentId: string): Promise<void> {
    await window.qazinho?.cancelAgentSignIn(agentId);
  }

  public static async sendSignInCode(props: {
    agentId: string;
    code: string;
  }): Promise<void> {
    await window.qazinho?.sendAgentSignInCode(props);
  }

  public static onSignIn(listener: (progress: AgentSignInProgress) => void): () => void {
    return window.qazinho?.onAgentSignIn(listener) ?? (() => undefined);
  }
}

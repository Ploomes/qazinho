import type {
  AgentSignInProgress,
  IAgentEvent,
  IAgentLimits,
  IAskAgent,
  IChatTurn,
} from '@/shared/types';
import { i18n } from '@/languages';

/** The only caller of the agent side of the bridge. */
export class Agent {
  public static async ask(ask: IAskAgent): Promise<IChatTurn> {
    return (
      (await window.qazinho?.askAgent(ask)) ?? {
        sessionId: null,
        text: i18n.t('COMMON.NO_BRIDGE'),
        usage: null,
        costUsd: null,
        isError: true,
        answer: null,
        failure: null,
        code: null,
      }
    );
  }

  public static async stop(workspaceId: string): Promise<void> {
    await window.qazinho?.stopAgent(workspaceId);
  }

  public static async limits(agentId: string): Promise<IAgentLimits | null> {
    return (await window.qazinho?.readAgentLimits(agentId)) ?? null;
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

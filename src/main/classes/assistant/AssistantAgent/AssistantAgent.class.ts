import type { IAssistantAgent } from './types';
import type {
  AppToolCall,
  IAgentTurn,
  IAssistantAsk,
  IAssistantTurn,
} from '@/shared/types';
import { ASSISTANT } from '@/main/constants/ASSISTANT';
import { agentFailure, isLostSession, toldAfterTurn } from '@/main/library';
import { ASSISTANT_WAIT } from '@/shared/constants';
import { checkBuildPaths } from './library';

/**
 * Pergunta ao agente do próprio QA como o assistente, com as ferramentas do app do
 * QAzinho servidas pelo turno e o app como está agora na mensagem dele.
 */
export class AssistantAgent {
  private readonly runner: IAssistantAgent['runner'];
  private readonly tools: IAssistantAgent['tools'];
  private readonly harness: IAssistantAgent['harness'];
  private readonly bridge: IAssistantAgent['bridge'];
  private readonly findCommand: IAssistantAgent['findCommand'];
  private readonly kindOf: IAssistantAgent['kindOf'];
  private readonly home: string;
  private readonly told = new Map<string, Record<string, string>>();
  private isAsking = false;
  private isStopped = false;

  public constructor(props: IAssistantAgent) {
    this.runner = props.runner;
    this.tools = props.tools;
    this.harness = props.harness;
    this.bridge = props.bridge;
    this.findCommand = props.findCommand;
    this.kindOf = props.kindOf;
    this.home = props.home;
  }

  /**
   * Uma mensagem ao assistente, na sessão que ele já tem; uma sessão que o agente perdeu
   * começa de novo.
   */
  public async ask(ask: IAssistantAsk): Promise<IAssistantTurn> {
    const unanswered = {
      sessionId: ask.sessionId,
      text: '',
      usage: null,
      costUsd: null,
      isError: true,
    };
    const command = await this.findCommand(ask.agentId);

    if (command === null)
      return {
        ...unanswered,
        failure: { reason: 'agent-missing', agentId: ask.agentId },
      };

    if (this.isAsking)
      return {
        ...unanswered,
        failure: { reason: 'other', said: 'The assistant is still answering.' },
      };

    const mcpConfig = this.tools.mcpConfigFor(ASSISTANT.scope, ASSISTANT_WAIT.toolMs);

    if (mcpConfig === null)
      return {
        ...unanswered,
        failure: { reason: 'other', said: "QAzinho's tools are not up yet." },
      };

    this.isAsking = true;
    this.tools.attachApp({
      scope: ASSISTANT.scope,
      perform: (call) => this.perform(call),
    });

    try {
      const first = await this.askOnce({
        ask,
        command,
        mcpConfig,
        sessionId: ask.sessionId,
      });
      const isLost =
        first.isError &&
        ask.sessionId !== null &&
        !this.isStopped &&
        isLostSession(first.text);
      const turn = isLost
        ? await this.askOnce({ ask, command, mcpConfig, sessionId: null })
        : first;

      if (this.isStopped)
        return { ...turn, isError: true, failure: { reason: 'stopped' } };

      return { ...turn, failure: agentFailure(turn) };
    } finally {
      this.tools.detachApp(ASSISTANT.scope);
      this.isAsking = false;
      this.isStopped = false;
    }
  }

  /**
   * Interrompe o turno do assistente, e solta qualquer chamada de ferramenta ainda
   * esperando pela página.
   */
  public stop(): void {
    if (!this.isAsking) return;

    this.isStopped = true;
    this.runner.cancel(ASSISTANT.scope);
    this.bridge.dropAll();
  }

  private async askOnce(props: {
    ask: IAssistantAsk;
    command: string;
    mcpConfig: string;
    sessionId: string | null;
  }): Promise<IAgentTurn> {
    const { ask, command, mcpConfig, sessionId } = props;
    const assistant = this.harness.assistant({
      text: ask.text,
      told: (sessionId === null ? undefined : this.told.get(sessionId)) ?? {},
      app: ask.app,
    });
    const turn = await this.runner.ask({
      workspaceId: ASSISTANT.scope,
      meter: { kind: 'assistant', workspaceId: null, projectId: null },
      agentId: ask.agentId,
      command,
      model: ask.model,
      sessionId,
      prompt: assistant.prompt,
      systemPrompt: assistant.systemPrompt,
      mcpConfig,
      allowedTools: assistant.tools.allowedTools,
      isStreamed: true,
    });

    if (!turn.isError && turn.sessionId !== null)
      this.told.set(turn.sessionId, toldAfterTurn({ turn, told: assistant.told }));

    return turn;
  }

  private async perform(call: AppToolCall): Promise<{ text: string; isError: boolean }> {
    const checked = await checkBuildPaths({ call, home: this.home, kindOf: this.kindOf });

    if (!checked.isOk) return { text: checked.text, isError: true };

    return this.bridge.act(checked.call);
  }
}

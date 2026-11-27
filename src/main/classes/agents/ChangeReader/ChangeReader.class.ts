import type { IChangeReader } from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { ChangeReading, IReadChange } from '@/shared/types';
import type { Harness } from '@ploomes/qazinho-harness';
import { CHANGE_READER } from './constants';

/**
 * Pergunta ao agente do próprio QA, só quando o QA pede, o que uma mudança nas fontes faz
 * com o plano, sem ferramentas e no modelo mais barato dele.
 */
export class ChangeReader {
  private readonly runner: Pick<AgentRunner, 'ask'>;
  private readonly harness: Pick<Harness, 'readChange' | 'readChangeAnswer'>;
  private readonly findCommand: (agentId: string) => Promise<string | null>;

  public constructor(props: IChangeReader) {
    this.runner = props.runner;
    this.harness = props.harness;
    this.findCommand = props.findCommand;
  }

  /** As trocas que o agente propõe, ou por que ele não propôs nenhuma. */
  public async read(request: IReadChange): Promise<ChangeReading> {
    const command = await this.findCommand(request.agentId);

    if (command === null) return { isRead: false, reason: 'agent-missing' };

    const asked = this.harness.readChange(request.brief);
    const turn = await this.runner.ask({
      workspaceId: `${CHANGE_READER.scopePrefix}${request.workspaceId}`,
      meter: { kind: 'change', workspaceId: request.workspaceId, projectId: null },
      agentId: request.agentId,
      command,
      model: CHANGE_READER.cheapestModel[request.agentId] ?? request.model,
      sessionId: null,
      prompt: asked.prompt,
      schema: asked.schema,
      systemPrompt: asked.systemPrompt,
      allowedTools: [],
      isSealed: true,
    });
    const read = turn.isError
      ? null
      : this.harness.readChangeAnswer({ text: turn.text, brief: request.brief });

    return read === null
      ? { isRead: false, reason: 'unanswered' }
      : { isRead: true, read };
  }
}

import type { IMemoryKeeper } from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IKeepMemories, MemoryKeeping } from '@/shared/types';
import type { Harness } from '@salve-software/qazinho-harness';
import { MEMORY_KEEPER } from './constants';

/** Pergunta ao agente do próprio QA o que muda no que ele guarda sobre um app. */
export class MemoryKeeper {
  private readonly runner: Pick<AgentRunner, 'ask'>;
  private readonly harness: Pick<Harness, 'keep' | 'readKeep'>;
  private readonly findCommand: (agentId: string) => Promise<string | null>;

  public constructor(props: IMemoryKeeper) {
    this.runner = props.runner;
    this.harness = props.harness;
    this.findCommand = props.findCommand;
  }

  /**
   * O que o agente pediu para mudar depois do que aconteceu, no modelo mais barato dele;
   * nada guardado quando o agente falta ou responde outra coisa.
   */
  public async keep(request: IKeepMemories): Promise<MemoryKeeping> {
    const command = await this.findCommand(request.agentId);

    if (command === null) return { isKept: false };

    const { memories, events, language } = request;
    const asked = this.harness.keep({ memories, events, language });
    const turn = await this.runner.ask({
      workspaceId: `${MEMORY_KEEPER.scopePrefix}${request.projectId}`,
      agentId: request.agentId,
      command,
      model: MEMORY_KEEPER.cheapestModel[request.agentId] ?? request.model,
      sessionId: null,
      prompt: asked.prompt,
      schema: asked.schema,
      systemPrompt: asked.systemPrompt,
      allowedTools: [],
    });

    if (turn.isError) return { isKept: false };

    const ops = this.harness.readKeep({ text: turn.text, memories });

    return ops === null ? { isKept: false } : { isKept: true, ops };
  }
}

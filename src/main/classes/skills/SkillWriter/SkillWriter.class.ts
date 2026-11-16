import type { ISkillWriter } from '@/main/classes/skills/SkillWriter/types';
import type { IWriteSkill, SkillWritten } from '@/shared/types';
import { join } from 'node:path';
import { SKILL_WRITER } from '@/main/classes/skills/SkillWriter/constants';

/**
 * Escreve uma skill com o QA pelo agente dele: lê o que o QA conta e os casos que anexou,
 * pergunta o que os exemplos deixam em aberto, e devolve a skill.
 */
export class SkillWriter {
  private readonly runner: ISkillWriter['runner'];
  private readonly harness: ISkillWriter['harness'];
  private readonly library: ISkillWriter['library'];
  private readonly findCommand: ISkillWriter['findCommand'];
  private readonly stopped = new Set<string>();

  public constructor(props: ISkillWriter) {
    this.runner = props.runner;
    this.harness = props.harness;
    this.library = props.library;
    this.findCommand = props.findCommand;
  }

  /** Uma mensagem do QA: o que o agente respondeu, com a sessão, ou por que não. */
  public async ask(request: IWriteSkill): Promise<SkillWritten> {
    if (!SKILL_WRITER.id.test(request.draftId))
      return { isAnswered: false, reason: 'failed', said: '' };

    this.stopped.delete(request.draftId);

    const command = await this.findCommand(request.agentId);

    if (command === null) return { isAnswered: false, reason: 'agent-missing', said: '' };

    const root = this.library.draftDir(request.draftId);
    const files = await this.library.draftFiles(request.draftId);
    const writing = this.harness.writeSkill({
      text: request.text,
      attachments:
        files.length === 0
          ? null
          : {
              root,
              files: files.map(({ name, isImage }) => ({
                name,
                path: join(root, name),
                isImage,
              })),
            },
      current: request.current,
      language: request.language,
    });

    const turn = await this.runner.ask({
      workspaceId: `${SKILL_WRITER.scopePrefix}${request.draftId}`,
      meter: { kind: 'skill', workspaceId: null, projectId: null },
      agentId: request.agentId,
      command,
      model: request.model,
      sessionId: request.sessionId,
      prompt: writing.prompt,
      schema: writing.schema,
      systemPrompt: writing.systemPrompt,
      allowedTools: [],
      readDirs: writing.readDirs,
      tools: writing.readDirs.length === 0 ? [] : [...SKILL_WRITER.readTools],
    });

    if (this.stopped.has(request.draftId)) {
      this.stopped.delete(request.draftId);

      return { isAnswered: false, reason: 'stopped', said: '' };
    }

    const answer = turn.isError ? null : this.harness.readSkill(turn.text);

    return answer === null
      ? {
          isAnswered: false,
          reason: 'failed',
          said: turn.isError ? turn.text.trim() : '',
        }
      : { isAnswered: true, sessionId: turn.sessionId, answer };
  }

  /** Para a resposta em curso de um rascunho. */
  public stop(draftId: string): void {
    this.stopped.add(draftId);
    this.runner.cancel(`${SKILL_WRITER.scopePrefix}${draftId}`);
  }
}

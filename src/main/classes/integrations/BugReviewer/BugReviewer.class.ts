import type { IBugReviewer } from './types';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { BugFiler } from '@/main/classes/integrations/BugFiler';
import type { BugReview, IReviewBug } from '@/shared/types';
import type { Harness } from '@salve-software/qazinho-harness';
import { join } from 'node:path';
import { isInside } from '@/main/classes/storage/Archive/library';
import { BUG_REVIEW } from './constants';

/**
 * Pesa um bug que voltou contra a issue dele com o agente do próprio QA, e responde o
 * veredito dele.
 */
export class BugReviewer {
  private readonly filer: Pick<BugFiler, 'read'>;
  private readonly runner: Pick<AgentRunner, 'ask'>;
  private readonly harness: Pick<Harness, 'review' | 'readReview'>;
  private readonly findCommand: (agentId: string) => Promise<string | null>;
  private readonly runsRoot: string;

  public constructor(props: IBugReviewer) {
    this.filer = props.filer;
    this.runner = props.runner;
    this.harness = props.harness;
    this.findCommand = props.findCommand;
    this.runsRoot = props.runsRoot;
  }

  /**
   * Uma revisão de um bug visto de novo: se a issue precisa de atualização e a que o
   * agente escreveu, uma issue fechada sempre lida como regressão; ou por que não há.
   */
  public async review(request: IReviewBug): Promise<BugReview> {
    if (!BUG_REVIEW.id.test(request.workspaceId) || !BUG_REVIEW.id.test(request.bugId))
      return { isReviewed: false, failure: 'agent', said: '' };

    const read = await this.filer.read(request.issue);

    if (!read.isRead) return { isReviewed: false, failure: 'tracker', said: read.said };

    const command = await this.findCommand(request.agentId);

    if (command === null) return { isReviewed: false, failure: 'agent', said: '' };

    const folder = join(this.runsRoot, request.workspaceId);
    const asked = this.harness.review({
      issue: read.issue,
      bug: request.bug,
      sightings: request.sightings.map((seen) => ({
        ...seen,
        shot:
          seen.shot !== null && isInside({ root: folder, file: seen.shot })
            ? seen.shot
            : null,
      })),
      readDirs: [folder],
      language: request.language,
    });
    const turn = await this.runner.ask({
      workspaceId: `${BUG_REVIEW.scopePrefix}${request.workspaceId}/${request.bugId}`,
      meter: { kind: 'review', workspaceId: request.workspaceId, projectId: null },
      agentId: request.agentId,
      command,
      model: request.model,
      sessionId: null,
      prompt: asked.prompt,
      schema: asked.schema,
      systemPrompt: asked.systemPrompt,
      allowedTools: [],
      readDirs: asked.readDirs,
    });

    if (turn.isError)
      return { isReviewed: false, failure: 'agent', said: turn.text.trim() };

    const answer = this.harness.readReview(turn.text);

    if (answer === null) return { isReviewed: false, failure: 'agent', said: '' };

    return {
      isReviewed: true,
      verdict: read.issue.isClosed ? 'regression' : answer.verdict,
      reason: answer.reason,
      comment: answer.comment,
    };
  }
}

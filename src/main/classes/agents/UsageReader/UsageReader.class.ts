import type { IUsageReader } from './types';
import type { IAgentLimits } from '@/shared/types';
import { USAGE_READER } from './constants';
import { limitsOfReport } from './library';

/**
 * Lê até onde a conta do QA está dos limites dela pelo /usage do próprio Claude Code, que
 * não gasta nada.
 */
export class UsageReader {
  private readonly findAgent: IUsageReader['findAgent'];
  private readonly folder: string;
  private readonly exec: IUsageReader['exec'];
  private readonly now: () => Date;

  public constructor(props: IUsageReader) {
    this.findAgent = props.findAgent;
    this.folder = props.folder;
    this.exec = props.exec;
    this.now = props.now ?? (() => new Date());
  }

  /**
   * Os limites do agente como o /usage dele os imprime agora; null para um agente sem
   * /usage, um não instalado, ou um relatório sem sessão.
   */
  public async read(agentId: string): Promise<IAgentLimits | null> {
    if (agentId !== USAGE_READER.agentId) return null;

    const command = await this.findAgent(agentId);

    if (command === null) return null;

    const printed = await this.exec({
      command,
      args: USAGE_READER.args,
      cwd: this.folder,
      timeoutMs: USAGE_READER.timeoutMs,
    }).catch(() => null);

    if (printed === null) return null;

    try {
      const { result } = JSON.parse(printed) as { result?: unknown };

      return typeof result === 'string'
        ? limitsOfReport({ text: result, now: this.now() })
        : null;
    } catch {
      return null;
    }
  }
}

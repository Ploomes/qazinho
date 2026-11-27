import type { IOutsideSaved, IOutsideServerProps } from './types';
import type { IOutsideAgent, IOutsideServer, McpActionResult } from '@/shared/types';
import { randomUUID } from 'node:crypto';
import { chmod, readFile } from 'node:fs/promises';
import { MCP_RECIPES } from '@/main/classes/integrations/AgentMcp/constants';
import { writeAtomically } from '@/main/library';
import { MCP_HOST, outsideAddressOf } from '@ploomes/qazinho-harness';
import { OUTSIDE_FILE } from './constants';
import { outsideSavedOf } from './library';

/**
 * A porta do QAzinho para o agente que o QA usa no próprio editor: ligada só quando ele
 * pede, sempre no mesmo endereço, que o agente dele guarda.
 */
export class OutsideServer {
  private readonly file: IOutsideServerProps['file'];
  private readonly host: IOutsideServerProps['host'];
  private readonly mcp: IOutsideServerProps['mcp'];
  private readonly agents: IOutsideServerProps['agents'];
  private readonly perform: IOutsideServerProps['perform'];
  private saved: IOutsideSaved | null = null;
  private isBusy = false;

  public constructor(props: IOutsideServerProps) {
    this.file = props.file;
    this.host = props.host;
    this.mcp = props.mcp;
    this.agents = props.agents;
    this.perform = props.perform;
  }

  /** Reabre a porta se o QA a deixou ligada. */
  public async start(): Promise<void> {
    this.saved = outsideSavedOf(await readFile(this.file, 'utf8').catch(() => ''));

    if (this.saved?.isOn === true) await this.listen(this.saved);
  }

  public status(): IOutsideServer {
    return { isOn: this.saved?.isOn === true, isBusy: this.isBusy };
  }

  /** Liga ou desliga a porta; ligada de novo, ela volta ao endereço que tinha. */
  public async turn(isOn: boolean): Promise<IOutsideServer> {
    const saved: IOutsideSaved = {
      port: this.saved?.port ?? 0,
      token: this.saved?.token ?? randomUUID(),
      isOn,
    };

    if (isOn) await this.listen(saved);
    else {
      await this.host.stop();
      this.isBusy = false;
      await this.save(saved);
    }

    return this.status();
  }

  /** Um endereço novo em outra porta, levado aos agentes que guardavam o anterior. */
  public async renew(): Promise<IOutsideServer> {
    const holding = (await this.agentsHere()).filter(({ isAdded }) => isAdded);

    await this.listen({ isOn: true, port: 0, token: randomUUID() });
    await Promise.all(holding.map(({ id }) => this.addTo(id)));

    return this.status();
  }

  /** Os agentes desta máquina em que o QAzinho sabe adicionar um servidor. */
  public async agentsHere(): Promise<IOutsideAgent[]> {
    const url = this.savedAddress();
    const found = (await this.agents()).filter(
      ({ id, isFound }) => isFound && MCP_RECIPES[id] !== undefined,
    );

    return Promise.all(
      found.map(async ({ id, name }) => ({
        id,
        name,
        isAdded: url !== null && (await this.mcp.holds({ agentId: id, url })),
      })),
    );
  }

  public addTo(agentId: string): Promise<McpActionResult> {
    const url = this.savedAddress();

    return url === null
      ? Promise.resolve({ ok: false, error: 'Turn the server on first.' })
      : this.mcp.addAddress({ agentId, name: MCP_HOST.name, url });
  }

  public removeFrom(agentId: string): Promise<McpActionResult> {
    return this.mcp.removeName({ agentId, name: MCP_HOST.name });
  }

  /** O endereço para o QA copiar a outro agente; null com a porta nunca ligada. */
  public savedAddress(): string | null {
    return this.saved === null
      ? null
      : (this.host.address() ??
          outsideAddressOf({ port: this.saved.port, token: this.saved.token }));
  }

  public async close(): Promise<void> {
    await this.host.stop();
  }

  private async listen(wanted: IOutsideSaved): Promise<void> {
    const listening = await this.host.start({
      port: wanted.port,
      token: wanted.token,
      perform: this.perform,
    });

    this.isBusy = !listening.isListening;
    await this.save({
      ...wanted,
      port: listening.isListening ? listening.port : wanted.port,
    });
  }

  private async save(saved: IOutsideSaved): Promise<void> {
    this.saved = saved;
    await writeAtomically({ file: this.file, data: JSON.stringify(saved) });
    await chmod(this.file, OUTSIDE_FILE.mode);
  }
}

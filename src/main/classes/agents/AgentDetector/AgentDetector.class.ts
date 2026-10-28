import type { IDetectedAgent } from '@/shared/types';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findOnPath, machineDirectories } from '@/main/library';
import { AGENT_PROBES } from './constants';
import { defaultModelOf, isSignedInOf, statusOf } from './library';

/**
 * Acha os agentes que já estão nesta máquina por sondas de arquivo, depois pergunta a
 * cada um achado se está logado.
 */
export class AgentDetector {
  private detected: IDetectedAgent[] | null = null;

  /**
   * Em cache pela sessão: um painel de Configurações que remonta não deve sondar o disco
   * de novo.
   */
  public async detect(): Promise<IDetectedAgent[]> {
    if (this.detected) return this.detected;

    const directories = await machineDirectories();

    this.detected = await Promise.all(
      AGENT_PROBES.map(async ({ config, status, ...probe }) => {
        const found = findOnPath({ command: probe.command, directories });
        const text = await readFile(join(homedir(), config.file), 'utf8').catch(
          () => null,
        );

        const signedIn =
          found === null
            ? null
            : isSignedInOf({
                reads: status.reads,
                ...(await statusOf({ command: found, args: status.args })),
              });

        return {
          ...probe,
          isFound: found !== null,
          path: found,
          defaultModel:
            text === null ? null : defaultModelOf({ format: config.format, text }),
          isSignedIn: signedIn,
        };
      }),
    );

    return this.detected;
  }

  /**
   * Descarta o cache, para a próxima olhada ver o que uma instalação acabou de pôr no
   * disco.
   */
  public forget(): void {
    this.detected = null;
  }
}

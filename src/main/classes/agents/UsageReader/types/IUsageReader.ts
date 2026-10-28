/**
 * O que o UsageReader precisa: onde está cada CLI de agente, uma pasta onde rodá-la, e um
 * jeito de rodar um comando e ler o que ele imprimiu.
 */
export interface IUsageReader {
  findAgent: (agentId: string) => Promise<string | null>;
  folder: string;
  exec: (props: {
    command: string;
    args: readonly string[];
    cwd: string;
    timeoutMs: number;
  }) => Promise<string>;
  now?: () => Date;
}

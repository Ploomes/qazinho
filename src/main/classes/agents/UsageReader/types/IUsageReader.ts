/** What UsageReader needs: where each agent CLI is, a folder to run it in, and a way to run a command and read what it printed. */
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

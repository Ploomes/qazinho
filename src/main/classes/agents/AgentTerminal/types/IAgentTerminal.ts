/**
 * The agent CLI to run out of sight: its command, where it runs, and the environment it
 * gets.
 */
export interface IAgentTerminal {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
}

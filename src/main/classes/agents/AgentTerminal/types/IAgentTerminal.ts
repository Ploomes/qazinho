/**
 * A CLI de agente a rodar fora de vista: o comando, onde roda e o ambiente que recebe.
 */
export interface IAgentTerminal {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
}

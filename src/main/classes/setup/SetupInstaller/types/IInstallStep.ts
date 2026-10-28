/**
 * Um comando de uma instalação, pelo nome no path desta máquina ou por caminho absoluto;
 * o `doneIf` dá certo assim que o objetivo dele é cumprido.
 */
export interface IInstallStep {
  command: string;
  args: string[];
  doneIf?: { command: string; args: string[] };
}

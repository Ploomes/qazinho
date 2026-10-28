/**
 * Uma linha da varredura de processos do host inteiro, antes de ser cobrada de alguém.
 */
export interface IProcessRow {
  pid: number;
  parentPid: number;
  cpuSeconds: number;
  ramMb: number;
  name: string;
  command: string;
}

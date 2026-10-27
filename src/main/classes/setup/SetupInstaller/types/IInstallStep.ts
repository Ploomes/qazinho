/**
 * One command of an install, by name on this machine's path or by absolute path; `doneIf`
 * succeeds once its goal is met.
 */
export interface IInstallStep {
  command: string;
  args: string[];
  doneIf?: { command: string; args: string[] };
}

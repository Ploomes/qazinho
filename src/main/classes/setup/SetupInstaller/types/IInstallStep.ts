/** One command of an install, named by the binary so it is looked up on this machine's path. */
export interface IInstallStep {
  command: 'npm' | 'brew' | 'pipx';
  args: string[];
}

/** A Playwright suite the QA keeps in a git clone on this machine, connected to a project: its folder and config, the Playwright it runs on (null until its packages are installed), its branch and GitHub repository, and the settings its tests read. */
export interface ISuite {
  projectId: string;
  path: string;
  name: string;
  config: string;
  version: string | null;
  branch: string | null;
  repository: string | null;
  envKeys: string[];
  envFileKeys: string[];
}

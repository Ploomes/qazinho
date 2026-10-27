/**
 * A Playwright suite the QA keeps in a git clone, connected to a project: its folder,
 * config and branch.
 */
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

/**
 * Uma suíte de Playwright que o QA mantém num clone git, conectada a um projeto: a pasta,
 * a config e a branch.
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

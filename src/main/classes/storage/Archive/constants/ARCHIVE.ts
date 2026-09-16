/** One folder per workspace, and the plan beside it in YAML so a QA can read it in an editor. */
export const ARCHIVE = {
  projects: 'projects.json',
  workspaces: 'workspaces',
  workspace: 'workspace.json',
  plan: 'plan.yaml',
} as const;

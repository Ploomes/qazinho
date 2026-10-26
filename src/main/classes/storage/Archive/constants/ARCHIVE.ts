export const ARCHIVE = {
  projects: 'projects.json',
  workspaces: 'workspaces',
  workspaceId: /^[\w-]+$/,
  runs: 'runs',
  videos: { mp4: 'run.mp4', webm: 'run.webm' },
  videoRemoved: 'video-removed.json',
  workspace: 'workspace.json',
  plan: 'plan.yaml',
  unreadPlan: /^plan\.unread-\d{8}-\d{6}\.yaml$/,
  recipes: 'recipes.json',
  network: 'network.json',
} as const;

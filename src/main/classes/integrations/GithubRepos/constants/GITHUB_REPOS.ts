export const GITHUB_REPOS = {
  repositoriesMs: 5 * 60_000,
  branchesMs: 60_000,
  pageSize: 100,
  branchPages: 10,
  pullRequests: 50,
  repositoryJq:
    '.[] | {id: .id, owner: .owner.login, name: .name, isPrivate: .private, defaultBranch: .default_branch, pushedAt: .pushed_at, description: .description}',
  pushJq: '.[] | {ref, timestamp}',
  pullJq:
    '.[] | {number, title, head: .head.ref, headRepo: .head.repo.full_name, updatedAt: .updated_at}',
} as const;

import type { IGithubApi, IGithubRepos } from './types';
import type { IBranchList, IRepositoryList, IRepositoryRef } from '@/shared/types';
import { GITHUB_REPOS } from './constants';
import { branchesOf, jsonLinesOf, repositoryOf } from './library';

/** The QA's repositories and their branches, as GitHub lists them through gh; each list is kept for a little while. */
export class GithubRepos {
  private readonly github: IGithubApi;
  private readonly now: () => number;
  private kept: { at: number; list: IRepositoryList } | null = null;
  private readonly keptBranches = new Map<string, { at: number; list: IBranchList }>();

  public constructor(props: IGithubRepos) {
    this.github = props.github;
    this.now = props.now ?? Date.now;
  }

  /** Every repository the QA can read, most recently pushed first. */
  public async repositories(): Promise<IRepositoryList> {
    if (this.kept !== null && this.now() - this.kept.at < GITHUB_REPOS.repositoriesMs)
      return this.kept.list;

    const answer = await this.github.api({
      path: `user/repos?per_page=${String(GITHUB_REPOS.pageSize)}&sort=pushed&affiliation=owner,collaborator,organization_member`,
      paginate: true,
      jq: GITHUB_REPOS.repositoryJq,
    });

    if (!answer.isOk) return { isListed: false, failure: answer.failure };

    const list: IRepositoryList = {
      isListed: true,
      repositories: jsonLinesOf(answer.text).flatMap((line) => {
        const repository = repositoryOf(line);

        return repository === null ? [] : [repository];
      }),
    };

    this.kept = { at: this.now(), list };

    return list;
  }

  /** A repository's branches: its own first, then the ones that moved or head a pull request, then the rest. */
  public async branches(repository: IRepositoryRef): Promise<IBranchList> {
    const key = `${repository.owner}/${repository.name}`;
    const kept = this.keptBranches.get(key);

    if (kept !== undefined && this.now() - kept.at < GITHUB_REPOS.branchesMs)
      return kept.list;

    const base = `repos/${key}`;
    const [about, pushes, pulls, names] = await Promise.all([
      this.github.api({ path: base, jq: '.default_branch' }),
      this.github.api({
        path: `${base}/activity?activity_type=push&time_period=quarter&per_page=${String(GITHUB_REPOS.pageSize)}`,
        jq: GITHUB_REPOS.pushJq,
      }),
      this.github.api({
        path: `${base}/pulls?state=open&sort=updated&direction=desc&per_page=${String(GITHUB_REPOS.pullRequests)}`,
        jq: GITHUB_REPOS.pullJq,
      }),
      this.branchNames(base),
    ]);

    if (!about.isOk) return { isListed: false, failure: about.failure };
    if (!Array.isArray(names)) return names;

    const list: IBranchList = {
      isListed: true,
      branches: branchesOf({
        names,
        defaultBranch: about.text.trim(),
        pushes: pushes.isOk ? jsonLinesOf(pushes.text) : [],
        pulls: pulls.isOk ? jsonLinesOf(pulls.text) : [],
        repository: key,
      }),
    };

    this.keptBranches.set(key, { at: this.now(), list });

    return list;
  }

  /** Drops every list kept, so the next ask reads GitHub again. */
  public forget(): void {
    this.kept = null;
    this.keptBranches.clear();
  }

  private async branchNames(base: string): Promise<string[] | IBranchList> {
    const names: string[] = [];

    for (let page = 1; page <= GITHUB_REPOS.branchPages; page += 1) {
      const answer = await this.github.api({
        path: `${base}/branches?per_page=${String(GITHUB_REPOS.pageSize)}&page=${String(page)}`,
        jq: '.[].name',
      });

      if (!answer.isOk) return { isListed: false, failure: answer.failure };

      const found = answer.text.split('\n').filter((name) => name.trim() !== '');

      names.push(...found);

      if (found.length < GITHUB_REPOS.pageSize) break;
    }

    return names;
  }
}

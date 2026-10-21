/** A branch of a repository: whether it is the repository's own, the pull request it heads, and when it last moved. */
export interface IBranch {
  name: string;
  isDefault: boolean;
  pullRequest: { number: number; title: string } | null;
  movedAt: string | null;
}

/**
 * Where on GitHub the QA opens a pull request for a branch pushed from the one it came
 * from; null away from GitHub or with no branch to compare with.
 */
export function compareUrlOf(props: {
  repository: string | null;
  base: string;
  branch: string;
}): string | null {
  if (props.repository === null || props.base === '') return null;

  const path = (ref: string) => ref.split('/').map(encodeURIComponent).join('/');

  return `https://github.com/${props.repository}/compare/${path(props.base)}...${path(props.branch)}?expand=1`;
}

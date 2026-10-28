/**
 * Onde no GitHub o QA abre um pull request para uma branch enviada a partir da que ela
 * veio; null fora do GitHub ou sem branch para comparar.
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

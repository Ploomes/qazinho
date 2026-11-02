/**
 * Se uma lista segue o fim depois de rolar: colada no fim sempre segue, e só quem rola
 * para cima deixa de seguir, então o próprio scroll até o fim nunca desliga.
 */
export function followsEndAfter(props: {
  wasFollowing: boolean;
  top: number;
  previousTop: number;
  clientHeight: number;
  scrollHeight: number;
  edgePx: number;
}): boolean {
  const { wasFollowing, top, previousTop, clientHeight, scrollHeight, edgePx } = props;

  if (scrollHeight - top - clientHeight <= edgePx) return true;

  return top < previousTop ? false : wasFollowing;
}

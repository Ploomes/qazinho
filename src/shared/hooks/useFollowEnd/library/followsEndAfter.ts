/**
 * Se uma lista segue o fim depois de rolar: quem rola para cima deixa de seguir, por
 * pouco que seja, e volta ao chegar perto do fim; o scroll até o fim nunca desliga.
 */
export function followsEndAfter(props: {
  wasFollowing: boolean;
  top: number;
  previousTop: number;
  clientHeight: number;
  scrollHeight: number;
  edgePx: number;
  leaveEdgePx: number;
}): boolean {
  const {
    wasFollowing,
    top,
    previousTop,
    clientHeight,
    scrollHeight,
    edgePx,
    leaveEdgePx,
  } = props;
  const fromEnd = scrollHeight - top - clientHeight;

  if (top < previousTop && fromEnd > leaveEdgePx) return false;

  return fromEnd <= edgePx ? true : wasFollowing;
}

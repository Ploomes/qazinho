/**
 * Se uma lista segue o fim depois de rolar: só quem rola para cima deixa de seguir, por
 * pouco que seja; o navegador mexendo sozinho nunca desliga, e perto do fim sempre volta.
 */
export function followsEndAfter(props: {
  wasFollowing: boolean;
  byUser: boolean;
  top: number;
  previousTop: number;
  clientHeight: number;
  scrollHeight: number;
  edgePx: number;
  leaveEdgePx: number;
}): boolean {
  const {
    wasFollowing,
    byUser,
    top,
    previousTop,
    clientHeight,
    scrollHeight,
    edgePx,
    leaveEdgePx,
  } = props;
  const fromEnd = scrollHeight - top - clientHeight;

  if (byUser && top < previousTop && fromEnd > leaveEdgePx) return false;

  return fromEnd <= edgePx ? true : wasFollowing;
}

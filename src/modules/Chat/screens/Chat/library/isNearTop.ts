/** Um leitor tão perto do começo está pedindo mensagens mais antigas. */
export function isNearTop(props: { scrollTop: number; edgePx: number }): boolean {
  return props.scrollTop <= props.edgePx;
}

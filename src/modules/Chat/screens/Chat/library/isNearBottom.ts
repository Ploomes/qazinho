/**
 * Um leitor tão perto do fim está acompanhando a conversa, então as mensagens novas o
 * mantêm à vista.
 */
export function isNearBottom(props: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  edgePx: number;
}): boolean {
  return props.scrollHeight - props.scrollTop - props.clientHeight <= props.edgePx;
}

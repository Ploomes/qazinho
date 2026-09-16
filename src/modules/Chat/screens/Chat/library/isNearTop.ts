/** A reader this close to the start is asking for older messages. */
export function isNearTop(props: { scrollTop: number; edgePx: number }): boolean {
  return props.scrollTop <= props.edgePx;
}

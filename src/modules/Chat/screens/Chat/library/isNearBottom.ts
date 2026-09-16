/** A reader this close to the end is following the conversation, so new messages keep it in view. */
export function isNearBottom(props: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  edgePx: number;
}): boolean {
  return props.scrollHeight - props.scrollTop - props.clientHeight <= props.edgePx;
}

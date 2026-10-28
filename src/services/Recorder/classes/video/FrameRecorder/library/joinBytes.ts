/** Duas sequências de bytes como uma, do jeito que os chunks de um stream se somam. */
export function joinBytes(head: Uint8Array, tail: Uint8Array): Uint8Array {
  if (head.length === 0) return tail;

  const joined = new Uint8Array(head.length + tail.length);

  joined.set(head);
  joined.set(tail, head.length);

  return joined;
}

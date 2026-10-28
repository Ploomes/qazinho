/**
 * Os bytes que um pedido pediu: o arquivo inteiro, uma fatia dele, ou uma fatia que não
 * está nele.
 */
export type ByteRange =
  { kind: 'whole' } | { kind: 'slice'; start: number; end: number } | { kind: 'outside' };

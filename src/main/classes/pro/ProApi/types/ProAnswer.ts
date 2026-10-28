/**
 * O que a plataforma respondeu: o valor, ou o status, o código de erro e os detalhes com
 * que recusou; `unreachable` com status 0 quando não respondeu.
 */
export type ProAnswer<T> =
  | { isOk: true; value: T }
  | { isOk: false; status: number; error: string; details?: unknown };

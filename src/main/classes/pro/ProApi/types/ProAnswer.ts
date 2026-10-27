/**
 * What the platform answered: the value, or the status, error code and details it refused
 * with; `unreachable` with status 0 when it did not answer.
 */
export type ProAnswer<T> =
  | { isOk: true; value: T }
  | { isOk: false; status: number; error: string; details?: unknown };

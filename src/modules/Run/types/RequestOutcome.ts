/** How a request ended: an answer by its class of status, a failure on the way, one the app gave up on, or no answer heard. */
export type RequestOutcome =
  'ok' | 'redirect' | 'client' | 'server' | 'failed' | 'canceled' | 'unknown';

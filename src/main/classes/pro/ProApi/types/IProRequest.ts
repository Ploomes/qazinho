/**
 * One call to the platform: its method, path, body and the machine's token when it takes
 * one.
 */
export interface IProRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  token?: string;
}

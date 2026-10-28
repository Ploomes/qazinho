/**
 * Uma chamada à plataforma: o método, o caminho, o corpo e o token da máquina quando leva
 * um.
 */
export interface IProRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  token?: string;
}

/**
 * Uma chamada de sincronização a uma org: o token da máquina, a org, o caminho sob a
 * sincronização dela, e o corpo.
 */
export interface IProSyncCall {
  token: string;
  org: string;
  path: string;
  body: unknown;
}

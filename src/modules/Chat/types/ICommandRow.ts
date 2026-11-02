/**
 * Uma escolha que o seletor de comandos oferece: como se chama, uma palavra ao lado, uma
 * linha embaixo, e se ainda falta algo para ela rodar.
 */
export interface ICommandRow {
  id: string;
  label: string;
  tag: string | null;
  detail: string | null;
  isBlocked: boolean;
}

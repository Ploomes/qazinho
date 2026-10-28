/**
 * Uma escolha que o seletor de comandos oferece: como se chama, uma palavra ao lado, uma
 * linha embaixo, e se pode ser escolhida.
 */
export interface ICommandRow {
  id: string;
  label: string;
  tag: string | null;
  detail: string | null;
  isDisabled: boolean;
}

/** O que a tela vazia oferece antes da primeira run: a ação principal do plano. */
export interface IDeviceOffStart {
  label: string;
  onStart: () => void;
}

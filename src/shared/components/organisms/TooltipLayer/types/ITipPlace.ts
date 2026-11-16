/**
 * Onde o painel fica, o canto de cima à esquerda e o tamanho, e o centro da ponta medido
 * desse canto; em cima quando não cabe embaixo.
 */
export interface ITipPlace {
  x: number;
  y: number;
  width: number;
  height: number;
  tailX: number;
  tailY: number;
  isAbove: boolean;
}

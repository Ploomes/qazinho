/**
 * Um frame de um dispositivo como foi capturado: a imagem, quando, em ms de epoch, e o
 * formato largura-altura da tela que ele mostra.
 */
export interface ILiveFrame {
  jpeg: Buffer;
  at: number;
  ratio: number;
}

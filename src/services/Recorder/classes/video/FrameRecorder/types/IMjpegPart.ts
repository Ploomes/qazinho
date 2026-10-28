/**
 * Um frame lido do stream vivo: o JPEG, quando foi capturado em ms de epoch, e o formato
 * largura-altura da tela dele.
 */
export interface IMjpegPart {
  jpeg: Uint8Array<ArrayBuffer>;
  at: number;
  ratio: number;
}

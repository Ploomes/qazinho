/**
 * Um JPEG como uma parte de um corpo multipart/x-mixed-replace, com o momento em que foi
 * capturado e o formato da tela; um <img> lê só a imagem.
 */
export function mjpegPart(props: {
  boundary: string;
  jpeg: Buffer;
  at: number;
  ratio: number;
}): Buffer {
  const head = [
    `--${props.boundary}`,
    'Content-Type: image/jpeg',
    `Content-Length: ${String(props.jpeg.length)}`,
    `X-Captured-At: ${String(props.at)}`,
    `X-Screen-Ratio: ${String(props.ratio)}`,
    '',
    '',
  ].join('\r\n');

  return Buffer.concat([Buffer.from(head), props.jpeg, Buffer.from('\r\n')]);
}

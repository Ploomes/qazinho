/** One JPEG as a part of a multipart/x-mixed-replace body, with when it was captured and the screen's shape; an <img> reads only the image. */
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

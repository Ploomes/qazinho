/** One JPEG as a part of a multipart/x-mixed-replace body, which an <img> redraws on arrival. */
export function mjpegPart(props: { boundary: string; jpeg: Buffer }): Buffer {
  const head = `--${props.boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: ${String(props.jpeg.length)}\r\n\r\n`;

  return Buffer.concat([Buffer.from(head), props.jpeg, Buffer.from('\r\n')]);
}

/** The bytes a base64 data URL carries, or nothing for any other string. */
export function bytesOfDataUrl(dataUrl: string): Buffer | null {
  const payload = /^data:[\w.+-]+\/[\w.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)?.[1];

  return payload === undefined ? null : Buffer.from(payload, 'base64');
}

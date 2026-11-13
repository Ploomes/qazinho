/** A porta em que a loja de exemplo subiu da última vez, ou null para nenhuma. */
export function savedPortOf(text: string): number | null {
  try {
    const { port } = JSON.parse(text) as { port?: unknown };

    return typeof port === 'number' && Number.isInteger(port) && port > 0 && port < 65_536
      ? port
      : null;
  } catch {
    return null;
  }
}

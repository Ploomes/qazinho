const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const LOCAL_HOST =
  /^(localhost|0\.0\.0\.0|\[::1\]|(127|10)(\.\d+){3}|192\.168(\.\d+){2}|172\.(1[6-9]|2\d|3[01])(\.\d+){2}|.+\.(localhost|local|test))$/i;

function isLocal(text: string): boolean {
  const host = (text.split(/[/?#]/)[0] ?? '').replace(/:\d+$/, '');

  return LOCAL_HOST.test(host);
}

/** The address a browser opens for what the QA typed: http for this machine and its network, https elsewhere; null when it is no web address. */
export function webAddressOf(typed: string): string | null {
  const text = typed.trim();

  if (text.length === 0 || /\s/.test(text)) return null;

  const address = SCHEME.test(text)
    ? text
    : `${isLocal(text) ? 'http' : 'https'}://${text}`;

  try {
    const url = new URL(address);

    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== ''
      ? address
      : null;
  } catch {
    return null;
  }
}

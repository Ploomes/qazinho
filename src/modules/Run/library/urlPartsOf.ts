const ADDRESS = /^([a-z][a-z\d+.-]*:\/\/)([^/?#]*)([^#]*)/i;

/** An address split as a QA reads it: its origin, the host without any login, and the path with its query; a variable's name or a hidden value stays as written. */
export function urlPartsOf(url: string): {
  origin: string | null;
  host: string;
  path: string;
} {
  const match = ADDRESS.exec(url);

  if (match === null) return { origin: null, host: '', path: url };

  const [, scheme = '', authority = '', rest = ''] = match;
  const host = authority.slice(authority.lastIndexOf('@') + 1);

  return {
    origin: `${scheme}${host}`.toLowerCase(),
    host,
    path: rest === '' ? '/' : rest,
  };
}

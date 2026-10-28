const ADDRESS = /^([a-z][a-z\d+.-]*:\/\/)([^/?#]*)([^#]*)/i;

/**
 * Um endereço dividido como um QA o lê: a origem, o host sem login, e o caminho com a
 * query; o nome de uma variável ou um valor escondido fica como escrito.
 */
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

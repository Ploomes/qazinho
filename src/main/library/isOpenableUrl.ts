const LOOPBACK = ['localhost', '127.0.0.1', '[::1]'];

/**
 * Se um endereço pode ir para o navegador do sistema: https, ou http só nesta máquina; um
 * outro esquema pode abrir um programa qualquer do SO.
 */
export function isOpenableUrl(url: string): boolean {
  if (!URL.canParse(url)) return false;

  const { protocol, hostname, username, password } = new URL(url);

  if (username !== '' || password !== '') return false;

  return protocol === 'https:' || (protocol === 'http:' && LOOPBACK.includes(hostname));
}

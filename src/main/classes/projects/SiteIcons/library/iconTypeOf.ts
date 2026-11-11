const BY_EXTENSION: Record<string, string> = {
  ico: 'image/x-icon',
  png: 'image/png',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * O tipo de imagem que uma resposta trouxe, pelo cabeçalho ou, quando o servidor não diz,
 * pela extensão do endereço; null quando não é uma imagem.
 */
export function iconTypeOf(props: {
  contentType: string | null;
  url: string;
}): string | null {
  const declared = (props.contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';

  if (declared.startsWith('image/')) return declared;
  if (declared !== '' && declared !== 'application/octet-stream') return null;

  const extension = /\.([a-z]+)(?:\?|#|$)/i.exec(new URL(props.url).pathname)?.[1];

  return BY_EXTENSION[(extension ?? '').toLowerCase()] ?? null;
}

const MAX_NAME = 120;

/**
 * O nome com que um anexo fica na pasta: o id dele e o nome do arquivo sem nada que
 * saia da pasta, cortado mantendo a extensão.
 */
export function storedNameOf(props: { id: string; name: string }): string {
  const clean = [...props.name]
    .map((char) => (char.charCodeAt(0) < 32 ? '_' : char))
    .join('')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/^\.+/, '_')
    .trim();
  const dot = clean.lastIndexOf('.');
  const extension = dot > 0 && clean.length - dot <= 10 ? clean.slice(dot) : '';
  const stem = clean.slice(0, clean.length - extension.length).slice(0, MAX_NAME);

  return `${props.id}-${stem === '' ? 'file' : stem}${extension}`;
}

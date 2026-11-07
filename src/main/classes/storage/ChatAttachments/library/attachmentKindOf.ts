const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/** Se o agente vê um anexo como imagem, pela extensão: as que ele lê como foto. */
export function attachmentKindOf(name: string): 'image' | 'file' {
  const lower = name.toLowerCase();

  return IMAGE_EXTENSIONS.some((extension) => lower.endsWith(extension))
    ? 'image'
    : 'file';
}

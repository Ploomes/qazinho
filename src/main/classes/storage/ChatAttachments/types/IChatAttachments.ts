/**
 * Onde os anexos do chat ficam, um subpasta por workspace, e como a miniatura de uma
 * imagem é feita, pelo Electron, fora da classe.
 */
export interface IChatAttachments {
  root: string;
  previewOf: (file: string) => string | null;
}

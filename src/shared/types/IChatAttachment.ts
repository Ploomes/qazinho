/**
 * Um arquivo que o QA anexou a uma mensagem do chat, guardado na pasta do workspace sob
 * `file`, com uma miniatura quando é imagem.
 */
export interface IChatAttachment {
  id: string;
  name: string;
  file: string;
  kind: 'image' | 'file';
  size: number;
  preview: string | null;
}

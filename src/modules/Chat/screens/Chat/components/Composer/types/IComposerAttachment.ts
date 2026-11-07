/** Um arquivo que vai com a próxima mensagem: o nome e a miniatura de uma imagem. */
export interface IComposerAttachment {
  key: string;
  name: string;
  preview: string | null;
  removeLabel: string;
}

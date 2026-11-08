/** Uma tela na coluna ao lado do dispositivo: a imagem, e quem está nela. */
export interface IScreenThumb {
  id: number;
  streamUrl: string | null;
  isAgent: boolean;
  isShown: boolean;
  tip: string;
}

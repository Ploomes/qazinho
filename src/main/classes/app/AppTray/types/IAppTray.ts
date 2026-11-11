/** O que o ícone da bandeja recebe: a imagem dele, e o que abrir e sair fazem. */
export interface IAppTray {
  icon: string;
  onOpen: () => void;
  onQuit: () => void;
}

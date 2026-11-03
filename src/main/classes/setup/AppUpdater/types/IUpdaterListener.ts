/** O que o atualizador do sistema conta enquanto procura e baixa uma versão. */
export interface IUpdaterListener {
  available: (version: string) => void;
  progress: (percent: number) => void;
  downloaded: (version: string) => void;
  nothing: () => void;
  failed: (message: string) => void;
}

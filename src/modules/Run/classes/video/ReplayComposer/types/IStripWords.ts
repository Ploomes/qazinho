/** As palavras que a faixa escreve, no idioma que o QA lê. */
export interface IStripWords {
  title: string;
  count: (props: { shown: number; total: number }) => string;
  errors: (count: number) => string;
  failed: string;
  canceled: string;
  empty: string;
  language: string;
}

/** Baixa um arquivo da plataforma para o disco; false quando ele não veio. */
export type ProDownloader = (props: {
  url: string;
  headers: Record<string, string>;
  file: string;
}) => Promise<boolean>;

/**
 * Como uma fonte do plano estava quando ele foi escrito, para conferir depois, sem IA, se
 * ela mudou: o texto da história ou da página e quando.
 */
export type ISourceSnapshot =
  | { kind: 'story'; key: string; url: string; text: string; at: string }
  | {
      kind: 'page';
      pageId: string;
      title: string;
      url: string;
      text: string;
      at: string;
    };

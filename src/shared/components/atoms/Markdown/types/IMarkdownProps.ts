/**
 * Markdown que um agente escreveu, como texto: é renderizado, nunca roda como HTML.
 * `isStreaming` deixa cada bloco novo aparecer suave enquanto o texto ainda chega.
 */
export interface IMarkdownProps {
  children: string;
  isStreaming?: boolean;
}

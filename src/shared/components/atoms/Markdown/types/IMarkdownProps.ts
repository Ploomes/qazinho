/**
 * Markdown que um agente escreveu, como texto: é renderizado, nunca roda como HTML.
 * `isRevealing` deixa os blocos subirem um depois do outro.
 */
export interface IMarkdownProps {
  children: string;
  isRevealing?: boolean;
}

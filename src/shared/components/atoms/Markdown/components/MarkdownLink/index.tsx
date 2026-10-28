import type { IMarkdownLinkProps } from './types';

/**
 * Um link saindo da resposta de um agente: abre no navegador do sistema, nunca dentro do
 * app.
 */
export const MarkdownLink: React.FC<IMarkdownLinkProps> = (props) => (
  <a className="markdown__link" href={props.href} target="_blank" rel="noreferrer">
    {props.children}
  </a>
);

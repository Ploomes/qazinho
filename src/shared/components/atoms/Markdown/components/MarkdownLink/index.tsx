import type { IMarkdownLinkProps } from './types';

/**
 * A link out of an agent's answer: it opens in the system browser, never inside the app.
 */
export const MarkdownLink: React.FC<IMarkdownLinkProps> = (props) => (
  <a className="markdown__link" href={props.href} target="_blank" rel="noreferrer">
    {props.children}
  </a>
);

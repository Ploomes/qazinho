import type { IMarkdownProps } from './types';
import ReactMarkdown from 'react-markdown';
import { MARKDOWN } from './constants';
import { useMarkdownViewModel } from './hooks';
import './styles.css';

/**
 * O que um agente escreveu, renderizado: parágrafos, listas, ênfase, código e tabelas, na
 * tipografia do app.
 */
export const Markdown: React.FC<IMarkdownProps> = (props) => {
  const { className } = useMarkdownViewModel(props);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={MARKDOWN.remarkPlugins}
        components={MARKDOWN.components}
      >
        {props.children}
      </ReactMarkdown>
    </div>
  );
};

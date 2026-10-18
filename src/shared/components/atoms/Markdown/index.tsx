import type { IMarkdownProps } from './types';
import ReactMarkdown from 'react-markdown';
import { MARKDOWN } from './constants';
import './styles.css';

/** What an agent wrote, rendered: paragraphs, lists, emphasis, code and tables, in the app's type. */
export const Markdown: React.FC<IMarkdownProps> = (props) => (
  <div className="markdown">
    <ReactMarkdown
      remarkPlugins={MARKDOWN.remarkPlugins}
      components={MARKDOWN.components}
    >
      {props.children}
    </ReactMarkdown>
  </div>
);

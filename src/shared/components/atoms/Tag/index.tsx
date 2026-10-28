import type { ITagProps } from './types';
import './styles.css';

/**
 * Um sticker de tag na Tinta da marca, maiúsculas mono lima dentro de uma borda de
 * recorte, como "BY SALVE SOFTWARE".
 */
export const Tag: React.FC<ITagProps> = (props) => (
  <span className="tag">{props.children}</span>
);

import type { ITagProps } from './types';
import './styles.css';

/** A tag sticker in the brand's Tinta, lime mono capitals inside a cut edge, like "BY SALVE SOFTWARE". */
export const Tag: React.FC<ITagProps> = (props) => (
  <span className="tag">{props.children}</span>
);

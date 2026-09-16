import type { IErrorBlockProps } from './types';
import { Eyebrow } from '@/components/atoms';
import './styles.css';

/** A broken tool is never a test result: this block can never look like a verdict. */
export const ErrorBlock: React.FC<IErrorBlockProps> = ({ message }) => (
  <div className="error-block">
    <Eyebrow>gocrash error · not a test result</Eyebrow>
    <p className="error-block__text">{message.text}</p>
    {message.fix !== null && <span className="error-block__fix">{message.fix}</span>}
  </div>
);

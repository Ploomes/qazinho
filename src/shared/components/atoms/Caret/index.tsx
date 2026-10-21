import type { ICaretProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { useCaretViewModel } from './hooks';
import './styles.css';

/** The caret beside something that folds open: it turns down as it opens, and back as it shuts. */
export const Caret: React.FC<ICaretProps> = (props) => {
  const { className } = useCaretViewModel(props);

  return (
    <span className={className} aria-hidden="true">
      <Icon name="caretRight" />
    </span>
  );
};

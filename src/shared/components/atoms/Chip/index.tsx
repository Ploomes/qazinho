import type { IChipProps } from './types';
import { Icon } from '@/shared/components/atoms/Icon';
import { useChipViewModel } from './hooks';
import './styles.css';

export const Chip: React.FC<IChipProps> = (props) => {
  const { isPressable, hasDot, dotTone, hasCaret, popup, onChipClick } =
    useChipViewModel(props);

  const content = (
    <>
      {hasDot && <span className="chip__dot" style={{ background: dotTone }} />}
      {props.children}
      {hasCaret && (
        <span className="chip__caret">
          <Icon name="caretDown" />
        </span>
      )}
    </>
  );

  if (!isPressable) return <span className="chip">{content}</span>;

  return (
    <button type="button" className="chip" aria-haspopup={popup} onClick={onChipClick}>
      {content}
    </button>
  );
};

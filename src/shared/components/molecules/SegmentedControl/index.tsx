import type { ISegmentedControlProps } from './types';
import { motion } from 'motion/react';
import { STICKER } from '@/shared/constants';
import { useSegmentedControlViewModel } from './hooks';
import './styles.css';

/**
 * Uma escolha entre poucas opções, em que o destaque desliza até a que foi escolhida e as
 * setas andam entre elas.
 */
export const SegmentedControl: React.FC<ISegmentedControlProps> = (props) => {
  const { thumbId, items, onItemKeyDown } = useSegmentedControlViewModel(props);

  return (
    <div className="segmented" role="radiogroup" aria-label={props.label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={item.isOn}
          tabIndex={item.tabIndex}
          className={item.className}
          onClick={item.onPick}
          onKeyDown={onItemKeyDown}
        >
          {item.isOn && (
            <motion.span
              layoutId={thumbId}
              className="segmented__thumb"
              transition={STICKER.spring}
            />
          )}
          <span className="segmented__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

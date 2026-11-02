import type { IViewportPickerProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useViewportPickerViewModel } from './hooks';
import './styles.css';

/**
 * O tamanho de janela em que o navegador abre, escolhido antes de uma run ou mudado
 * durante uma.
 */
export const ViewportPicker: React.FC<IViewportPickerProps> = (props) => {
  const { options } = useViewportPickerViewModel(props);
  const { t } = useTranslation();

  return (
    <div className="viewport-picker">
      <Eyebrow>{t('DEVICE.VIEWPORT')}</Eyebrow>
      <div className="viewport-picker__list" role="radiogroup">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.isActive}
            className={option.className}
            onClick={option.onSelect}
          >
            {option.isActive && (
              <motion.span
                layoutId={props.layoutId}
                className="viewport-picker__mark"
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              />
            )}
            <span className="viewport-picker__label">{option.label}</span>
            <span className="viewport-picker__size">{option.size}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

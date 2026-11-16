import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTooltipLayerViewModel } from './hooks';
import './styles.css';

/**
 * O painel de dica que o app divide: abre ao lado do que o ponteiro toca e desliza até o
 * vizinho seguinte, trocando as palavras, em vez de fechar e abrir de novo.
 */
export const TooltipLayer: React.FC = () => {
  const { sizes, measureRef, measureClassName, measured, panel } =
    useTooltipLayerViewModel();

  return createPortal(
    <>
      <span
        ref={measureRef}
        className={measureClassName}
        style={sizes as CSSProperties}
        aria-hidden="true"
      >
        <span className="tooltip-layer__inner">{measured}</span>
      </span>
      <AnimatePresence>
        {panel !== null && (
          <motion.div
            key={panel.key}
            className={panel.className}
            role="tooltip"
            style={sizes as CSSProperties}
            initial={panel.initial}
            animate={panel.animate}
            exit={panel.exit}
            transition={panel.transition}
          >
            <motion.span
              className="tooltip-layer__tail"
              initial={false}
              animate={panel.tail}
              transition={panel.tailTransition}
            />
            <span className="tooltip-layer__clip">
              <AnimatePresence initial={false}>
                <motion.span
                  key={panel.label.key}
                  className="tooltip-layer__label"
                  style={panel.label.style as CSSProperties}
                  initial={{ opacity: 0 }}
                  animate={panel.labelIn}
                  exit={panel.labelOut}
                >
                  {panel.label.content}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};

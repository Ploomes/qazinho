import type { ISuiteDiffProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Caret } from '@/shared/components/atoms';
import { useSuiteDiffViewModel } from './hooks';
import './styles.css';

/**
 * One file a change touched: its path, what was done to it, and its lines added and
 * removed, folded open.
 */
export const SuiteDiff: React.FC<ISuiteDiffProps> = (props) => {
  const {
    style,
    transition,
    isOpen,
    onToggle,
    path,
    status,
    statusClassName,
    added,
    removed,
    lines,
  } = useSuiteDiffViewModel(props);

  return (
    <section className="suite-diff" style={style}>
      <button
        type="button"
        className="suite-diff__head"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <Caret isOpen={isOpen} />
        <span className={statusClassName}>{status}</span>
        <span className="suite-diff__path">{path}</span>
        <span className="suite-diff__added">{added}</span>
        <span className="suite-diff__removed">{removed}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="lines"
            className="suite-diff__fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="suite-diff__lines">
              {lines.map((line) => (
                <div key={line.key} className={line.className}>
                  <span className="suite-diff__number">{line.old}</span>
                  <span className="suite-diff__number">{line.new}</span>
                  <code className="suite-diff__text">{line.text}</code>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

import type { IReplayLogProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { useReplayLogViewModel } from './hooks';
import './styles.css';

/**
 * The run's cases beside its video, kept in step with it: the case playing opens, its
 * step lights up, and a click jumps there.
 */
export const ReplayLog: React.FC<IReplayLogProps> = (props) => {
  const { eyebrow, foldTransition, nowTransition, chapters, onUserScroll } =
    useReplayLogViewModel(props);

  return (
    <div className="replay-log" onWheel={onUserScroll} onTouchMove={onUserScroll}>
      <span className="replay-log__eyebrow">{eyebrow}</span>

      {chapters.map((chapter) => (
        <div key={chapter.key} className={chapter.className}>
          <button type="button" className="replay-log__head" onClick={chapter.onClick}>
            <span className={chapter.iconClassName}>
              <Icon name={chapter.icon} />
            </span>
            <span className="replay-log__id">{chapter.id}</span>
            <span className="replay-log__title">{chapter.title}</span>
            <span className="replay-log__duration">{chapter.duration}</span>
          </button>

          <AnimatePresence initial={false}>
            {chapter.isOpen && (
              <motion.div
                key="steps"
                className="replay-log__fold"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={foldTransition}
              >
                <ol className="replay-log__steps">
                  {chapter.steps.map((step) => (
                    <li key={step.key} className="replay-log__item">
                      <button
                        ref={step.ref}
                        type="button"
                        className={step.className}
                        onClick={step.onClick}
                      >
                        {step.isNow && (
                          <motion.span
                            layoutId="replay-log-now"
                            className="replay-log__now"
                            transition={nowTransition}
                          />
                        )}
                        <span className="replay-log__number">{step.number}</span>
                        <span className={step.iconClassName}>
                          <Icon name={step.icon} />
                        </span>
                        <span className="replay-log__action">{step.action}</span>
                      </button>

                      {step.bugs.map((bug) => (
                        <button
                          key={bug.key}
                          type="button"
                          className={bug.className}
                          onClick={bug.onClick}
                        >
                          <span className="replay-log__bug-mark" aria-hidden="true" />
                          <span className="replay-log__bug-id">{bug.id}</span>
                          <span className="replay-log__bug-title">{bug.title}</span>
                        </button>
                      ))}
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

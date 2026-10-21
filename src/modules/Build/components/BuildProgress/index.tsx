import type { IBuildProgressProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Intern } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useBuildProgressViewModel } from './hooks';
import './styles.css';

/** A build as it goes: the code, the agent building it, the check of what it made, the agent's last lines, and how it ended. */
export const BuildProgress: React.FC<IBuildProgressProps> = (props) => {
  const view = useBuildProgressViewModel(props);

  if (view === null) return null;

  return (
    <div className="build-progress" aria-live="polite">
      <div className="build-progress__head">
        <Intern mood={view.mood} size={view.internSize} isStill={!view.isWorking} />
        <span className="build-progress__title">{view.title}</span>
        <span className="build-progress__elapsed">{view.elapsed}</span>
      </div>

      <ol className="build-progress__steps">
        {view.steps.map((step) => (
          <li key={step.step} className={step.className}>
            <span className="build-progress__glyph" aria-hidden="true">
              {step.glyph}
            </span>
            <span className="build-progress__label">{step.label}</span>
          </li>
        ))}
      </ol>

      <AnimatePresence initial={false}>
        {view.lines.length > 0 && (
          <motion.ul
            key="lines"
            className="build-progress__lines"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            {view.lines.map((line) => (
              <motion.li
                key={line}
                className="build-progress__line"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                {line}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {view.built !== '' && (
          <motion.p
            key="built"
            className="build-progress__built"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <span aria-hidden="true">✓</span> {view.built}
            {view.builtNote !== '' && (
              <span className="build-progress__note">{view.builtNote}</span>
            )}
          </motion.p>
        )}
        {view.failed !== '' && (
          <motion.p
            key="failed"
            className="build-progress__failed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            {view.failed}
          </motion.p>
        )}
      </AnimatePresence>

      {view.hasActions && (
        <div className="build-progress__actions">
          {view.isWorking && (
            <Button size="sm" variant="secondary" onClick={view.onStop}>
              <span aria-hidden="true">■</span> {view.stopLabel}
            </Button>
          )}
          {view.canRetry && (
            <Button size="sm" variant="secondary" onClick={view.onRetry}>
              {view.retryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

import { motion } from 'motion/react';
import { Button, IconButton, Intern } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useRunNoticeViewModel } from './hooks';
import './styles.css';

/** A run that just ended, said inside the app wherever the QA is: how it went, and the way to it, for a few seconds. */
export const RunNotice: React.FC = () => {
  const {
    isShown,
    style,
    mood,
    internSize,
    kicker,
    title,
    tally,
    bugs,
    openLabel,
    canWatch,
    watchLabel,
    closeLabel,
    onOpen,
    onWatch,
    onClose,
    onCountdownEnd,
  } = useRunNoticeViewModel();

  if (!isShown) return null;

  return (
    <motion.aside
      className="run-notice"
      role="status"
      style={style}
      initial={STICKER.slap.initial}
      animate={STICKER.slap.animate}
      exit={STICKER.slap.exit}
    >
      <Intern mood={mood} size={internSize} isStill />

      <div className="run-notice__body">
        <span className="run-notice__kicker">{kicker}</span>
        <span className="run-notice__title">{title}</span>
        <span className="run-notice__tally">
          {tally.map((item) => (
            <span key={item.key} className={item.className} title={item.label}>
              <span aria-hidden="true">{item.glyph}</span> {item.count}
            </span>
          ))}
          {bugs !== '' && <span className="run-notice__bugs">{bugs}</span>}
        </span>
        <span className="run-notice__actions">
          <Button size="sm" variant="primary" onClick={onOpen}>
            {openLabel}
          </Button>
          {canWatch && (
            <Button size="sm" variant="ghost" onClick={onWatch}>
              <span aria-hidden="true">▶</span> {watchLabel}
            </Button>
          )}
        </span>
      </div>

      <span className="run-notice__close">
        <IconButton glyph="✕" label={closeLabel} size="sm" onClick={onClose} />
      </span>
      <span
        className="run-notice__time"
        aria-hidden="true"
        onAnimationEnd={onCountdownEnd}
      />
    </motion.aside>
  );
};

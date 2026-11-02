import { motion } from 'motion/react';
import { Button, Icon, IconButton, Intern } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useRunNoticeViewModel } from './hooks';
import './styles.css';

/**
 * Uma run que acabou de terminar, dita dentro do app onde quer que o QA esteja: como foi,
 * e o caminho até ela, por alguns segundos.
 */
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
      initial={STICKER.panel.initial}
      animate={STICKER.panel.animate}
      exit={STICKER.panel.exit}
    >
      <Intern mood={mood} size={internSize} isStill />

      <div className="run-notice__body">
        <span className="run-notice__kicker">{kicker}</span>
        <span className="run-notice__title">{title}</span>
        <span className="run-notice__tally">
          {tally.map((item) => (
            <span key={item.key} className={item.className} title={item.label}>
              <Icon name={item.icon} /> {item.count}
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
              <Icon name="play" /> {watchLabel}
            </Button>
          )}
        </span>
      </div>

      <span className="run-notice__close">
        <IconButton icon="close" label={closeLabel} size="sm" onClick={onClose} />
      </span>
      <span
        className="run-notice__time"
        aria-hidden="true"
        onAnimationEnd={onCountdownEnd}
      />
    </motion.aside>
  );
};

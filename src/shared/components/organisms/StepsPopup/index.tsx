import type { IStepsPopupProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@/shared/components/atoms';
import { BACKDROP, MOTION, STICKER } from '@/shared/constants';
import { useStepsPopupViewModel } from './hooks';
import './styles.css';

/** A small popup listing the steps QAzinho takes out of sight as they happen; the QA's own step points at its page. */
export const StepsPopup: React.FC<IStepsPopupProps> = (props) => {
  const {
    style,
    badgeClass,
    badgeMark,
    rows,
    detailClass,
    code,
    canSendCode,
    onCodeChange,
    onCodeSubmit,
    shownCopyLabel,
    onCopyShown,
    onBackdrop,
  } = useStepsPopupViewModel(props);

  return (
    <motion.div
      className="steps-popup"
      style={style}
      initial={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      animate={{ opacity: 1, backdropFilter: BACKDROP.blur }}
      exit={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      onClick={onBackdrop}
    >
      <motion.div
        className="steps-popup__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="steps-popup-title"
        layout
        initial={STICKER.panel.initial}
        animate={STICKER.panel.animate}
        exit={STICKER.panel.exit}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="steps-popup__head">
          <span className={badgeClass}>
            <AnimatePresence mode="wait" initial={false}>
              {badgeMark === null ? (
                <motion.span
                  key="badge"
                  className="steps-popup__badge-art"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  {props.badge}
                </motion.span>
              ) : (
                <motion.span
                  key={props.tone}
                  className="steps-popup__badge-mark"
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, transition: STICKER.spring }}
                  exit={{ opacity: 0, scale: 0.4 }}
                >
                  {badgeMark !== null && <Icon name={badgeMark} />}
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={props.tone}
              className="steps-popup__titles"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              <h2 id="steps-popup-title" className="steps-popup__title">
                {props.title}
              </h2>
              <p className="steps-popup__subtitle">{props.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </header>

        <ol className="steps-popup__steps" aria-live="polite">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.li
                key={row.key}
                className={row.className}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: MOTION.duration,
                  ease: MOTION.ease,
                  delay: row.delay,
                }}
              >
                <span className={row.markClass} aria-hidden="true">
                  <AnimatePresence initial={false}>
                    {row.mark !== null && (
                      <motion.span
                        key={row.mark}
                        className="steps-popup__tick"
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1, transition: STICKER.spring }}
                        exit={{ opacity: 0, scale: 0.3 }}
                      >
                        <Icon name={row.mark} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="steps-popup__label">{row.label}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>

        <AnimatePresence initial={false}>
          {props.hint !== null && (
            <motion.div
              key="hint"
              className="steps-popup__note"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <div className="steps-popup__hint">
                <p className="steps-popup__hint-text">{props.hint}</p>
                {props.shownCode !== null && (
                  <div className="steps-popup__shown">
                    <span className="steps-popup__code-label">
                      {props.shownCode.label}
                    </span>
                    <span className="steps-popup__shown-row">
                      <output className="steps-popup__shown-code">
                        {props.shownCode.code}
                      </output>
                      <Button size="sm" variant="primary" onClick={onCopyShown}>
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={shownCopyLabel}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{
                              duration: MOTION.durationFast,
                              ease: MOTION.ease,
                            }}
                          >
                            {shownCopyLabel}
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    </span>
                  </div>
                )}
                {props.page !== null && (
                  <a
                    className="steps-popup__link"
                    href={props.page.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {props.page.label} <Icon name="external" />
                  </a>
                )}
                {props.code !== null && (
                  <form
                    className="steps-popup__code"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onCodeSubmit();
                    }}
                  >
                    <label className="steps-popup__code-label" htmlFor="steps-popup-code">
                      {props.code.label}
                    </label>
                    <span className="steps-popup__code-row">
                      <input
                        id="steps-popup-code"
                        className="steps-popup__code-input"
                        value={code}
                        placeholder={props.code.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(event) => {
                          onCodeChange(event.target.value);
                        }}
                      />
                      <Button size="sm" disabled={!canSendCode} onClick={onCodeSubmit}>
                        {props.code.submit}
                      </Button>
                    </span>
                  </form>
                )}
              </div>
            </motion.div>
          )}
          {props.detail !== null && (
            <motion.div
              key="detail"
              className="steps-popup__note"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <pre className={detailClass}>{props.detail.text}</pre>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.footer
            key={props.tone}
            className="steps-popup__foot"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {props.actions.map((action) => (
              <Button key={action.key} variant={action.variant} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </motion.footer>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

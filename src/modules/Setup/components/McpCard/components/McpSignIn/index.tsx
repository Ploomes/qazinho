import type { IMcpSignInProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/atoms';
import { BACKDROP, MOTION, STICKER } from '@/shared/constants';
import { useMcpSignInViewModel } from './hooks';
import './styles.css';

/** The steps QAzinho takes to sign the QA's agent in to an MCP server, as they happen; only the last one is the QA's. */
export const McpSignIn: React.FC<IMcpSignInProps> = (props) => {
  const {
    style,
    tone,
    badgeClass,
    badgeMark,
    title,
    subtitle,
    rows,
    hint,
    pageUrl,
    detail,
    detailClass,
    isWorking,
    isConnected,
    isFailed,
    canRetry,
    canUseTerminal,
    onBackdrop,
  } = useMcpSignInViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      className="mcp-sign-in"
      style={style}
      initial={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      animate={{ opacity: 1, backdropFilter: BACKDROP.blur }}
      exit={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      onClick={onBackdrop}
    >
      <motion.div
        className="mcp-sign-in__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-sign-in-title"
        layout
        initial={STICKER.panel.initial}
        animate={STICKER.panel.animate}
        exit={STICKER.panel.exit}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="mcp-sign-in__head">
          <span className={badgeClass}>
            <AnimatePresence mode="wait" initial={false}>
              {badgeMark === null ? (
                <motion.img
                  key="logo"
                  className="mcp-sign-in__logo"
                  src={props.server.logo}
                  alt={props.server.name}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                />
              ) : (
                <motion.span
                  key={tone}
                  className="mcp-sign-in__badge-mark"
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 0.4, rotate: -40 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    transition: STICKER.spring,
                  }}
                  exit={{ opacity: 0, scale: 0.4 }}
                >
                  {badgeMark}
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tone}
              className="mcp-sign-in__titles"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              <h2 id="mcp-sign-in-title" className="mcp-sign-in__title">
                {title}
              </h2>
              <p className="mcp-sign-in__subtitle">{subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </header>

        <ol className="mcp-sign-in__steps" aria-live="polite">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.li
                key={row.step}
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
                    {row.mark !== '' && (
                      <motion.span
                        key={row.mark}
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          transition: STICKER.spring,
                        }}
                        exit={{ opacity: 0, scale: 0.3 }}
                      >
                        {row.mark}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="mcp-sign-in__label">{row.label}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>

        <AnimatePresence initial={false}>
          {hint !== null && (
            <motion.div
              key="hint"
              className="mcp-sign-in__note"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <div className="mcp-sign-in__hint">
                <p className="mcp-sign-in__hint-text">{hint}</p>
                {pageUrl !== null && (
                  <a
                    className="mcp-sign-in__link"
                    href={pageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('MCP.OPEN_PAGE_AGAIN')}
                  </a>
                )}
              </div>
            </motion.div>
          )}
          {detail !== null && (
            <motion.div
              key="detail"
              className="mcp-sign-in__note"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <pre className={detailClass}>{detail}</pre>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.footer
            key={tone}
            className="mcp-sign-in__foot"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {isWorking && (
              <Button variant="ghost" onClick={props.onCancel}>
                {t('COMMON.CANCEL')}
              </Button>
            )}
            {isConnected && (
              <Button variant="primary" onClick={props.onClose}>
                {t('MCP.DONE')}
              </Button>
            )}
            {isFailed && (
              <Button variant="ghost" onClick={props.onClose}>
                {t('COMMON.CLOSE')}
              </Button>
            )}
            {canUseTerminal && (
              <Button onClick={props.onUseTerminal}>{t('MCP.USE_TERMINAL')}</Button>
            )}
            {canRetry && (
              <Button variant="primary" onClick={props.onRetry}>
                {t('MCP.TRY_AGAIN')}
              </Button>
            )}
          </motion.footer>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

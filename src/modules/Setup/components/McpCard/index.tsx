import type { IMcpCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useMcpCardViewModel } from './hooks';
import './styles.css';

/** An MCP server in the QA's own agent: where it stands there, and the one step it needs next. */
export const McpCard: React.FC<IMcpCardProps> = (props) => {
  const {
    isConnected,
    text,
    needs,
    pill,
    statusLabel,
    action,
    isQuiet,
    isBusy,
    error,
    note,
    waiting,
    onAction,
  } = useMcpCardViewModel(props);
  const { t } = useTranslation();

  return (
    <div className={isConnected ? 'mcp-card mcp-card--on' : 'mcp-card'}>
      <div className="mcp-card__head">
        <span className="mcp-card__logo">
          <img src={props.server.logo} alt={props.server.name} />
        </span>
        <span className="mcp-card__text">
          <span className="mcp-card__name">{props.server.name}</span>
          <span className="mcp-card__about">{text}</span>
        </span>
        <StatusPill status={pill} label={statusLabel} />
        <AnimatePresence initial={false}>
          {action !== null && (
            <motion.button
              key="action"
              type="button"
              className={
                isQuiet ? 'mcp-card__action mcp-card__action--quiet' : 'mcp-card__action'
              }
              disabled={isBusy}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              onClick={() => {
                void onAction();
              }}
            >
              {isBusy && <span className="mcp-card__spinner" aria-hidden="true" />}
              {action}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mcp-card__body">
        <span className="mcp-card__eyebrow">{t('SETUP.WHAT_IT_NEEDS')}</span>
        <p className="mcp-card__about">{needs}</p>

        <AnimatePresence initial={false}>
          {waiting !== null && (
            <motion.p
              key="waiting"
              className="mcp-card__waiting"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <span className="mcp-card__spinner" aria-hidden="true" />
              {waiting}
            </motion.p>
          )}
          {error !== '' && (
            <motion.p
              key="error"
              className="mcp-card__error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              {error}
            </motion.p>
          )}
          {note !== null && (
            <motion.p
              key="note"
              className="mcp-card__note"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              {note}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

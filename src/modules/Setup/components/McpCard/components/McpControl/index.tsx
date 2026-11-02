import type { IMcpControlProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { McpSignIn } from '@/modules/Setup/components/McpCard/components/McpSignIn';
import { StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import './styles.css';

/** Em que pé um servidor MCP está no agente do QA, e o próximo passo dele. */
export const McpControl: React.FC<IMcpControlProps> = ({ server, view }) => (
  <>
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={view.pill}
        className="mcp-control__pill"
        layout="position"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
      >
        <StatusPill status={view.pill} label={view.statusLabel} />
      </motion.span>
    </AnimatePresence>
    <AnimatePresence initial={false}>
      {view.action !== null && (
        <motion.button
          key="action"
          type="button"
          className={
            view.isQuiet
              ? 'mcp-control__action mcp-control__action--quiet'
              : 'mcp-control__action'
          }
          disabled={view.isBusy}
          layout="position"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          onClick={() => {
            void view.onAction();
          }}
        >
          {view.isBusy && <span className="mcp-control__spinner" aria-hidden="true" />}
          {view.action}
        </motion.button>
      )}
    </AnimatePresence>
    {createPortal(
      <AnimatePresence>
        {view.signIn !== null && (
          <McpSignIn
            key="sign-in"
            server={server}
            agent={view.agent}
            progress={view.signIn}
            onCancel={view.onCancelSignIn}
            onClose={view.onCloseSignIn}
            onRetry={view.onRetrySignIn}
            onUseTerminal={view.onSignInInTerminal}
          />
        )}
      </AnimatePresence>,
      document.body,
    )}
  </>
);

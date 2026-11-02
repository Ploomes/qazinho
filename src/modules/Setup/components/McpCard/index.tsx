import type { IMcpCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { MOTION } from '@/shared/constants';
import { McpControl } from './components';
import { useMcpCardViewModel } from './hooks';
import './styles.css';

/**
 * Um servidor MCP no próprio agente do QA: em que pé está lá, e o único passo de que
 * precisa em seguida.
 */
export const McpCard: React.FC<IMcpCardProps> = (props) => {
  const view = useMcpCardViewModel(props);
  const { isConnected, text, error, note } = view;

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
        <McpControl server={props.server} view={view} />
      </div>

      <AnimatePresence initial={false}>
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
  );
};

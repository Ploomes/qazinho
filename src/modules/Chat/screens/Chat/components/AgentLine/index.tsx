import { AnimatePresence } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { ModelPopover } from '@/shared/components/organisms/ModelPopover';
import { SessionTip } from './components';
import { useAgentLineViewModel } from './hooks';
import './styles.css';

/** O modelo dentro do campo do chat, e o uso da sessão quando ela acaba. */
export const AgentLine: React.FC = () => {
  const {
    agentLabel,
    modelLabel,
    isModelMenuOpen,
    isSessionShown,
    sessionLabel,
    sessionTip,
    onToggleModelMenu,
  } = useAgentLineViewModel();

  return (
    <div className="agent-line">
      {isSessionShown && (
        <Tooltip
          isWide
          content={
            <SessionTip
              title={sessionTip.title}
              rows={sessionTip.rows}
              note={sessionTip.note}
            />
          }
        >
          <span className="agent-line__session" tabIndex={0}>
            {sessionLabel}
          </span>
        </Tooltip>
      )}

      <Tooltip content={agentLabel}>
        <button
          type="button"
          className="agent-line__model"
          aria-label={agentLabel}
          aria-haspopup="menu"
          aria-expanded={isModelMenuOpen}
          onClick={onToggleModelMenu}
        >
          {modelLabel}
          <Icon name="caretDown" />
        </button>
      </Tooltip>

      <AnimatePresence>
        {isModelMenuOpen && <ModelPopover key="model" at="composer" />}
      </AnimatePresence>
    </div>
  );
};

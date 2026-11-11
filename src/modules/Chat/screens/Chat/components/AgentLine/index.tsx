import { AnimatePresence } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { ModelPopover } from '@/shared/components/organisms/ModelPopover';
import { SessionTip } from './components';
import { useAgentLineViewModel } from './hooks';
import './styles.css';

/** O agente e o modelo sob o campo do chat, e o uso da sessão só quando ela está acabando. */
export const AgentLine: React.FC = () => {
  const {
    agentLabel,
    isModelMenuOpen,
    isSessionShown,
    sessionLabel,
    sessionTip,
    onToggleModelMenu,
  } = useAgentLineViewModel();

  return (
    <div className="agent-line">
      <button
        type="button"
        className="agent-line__model"
        aria-haspopup="menu"
        aria-expanded={isModelMenuOpen}
        onClick={onToggleModelMenu}
      >
        {agentLabel}
        <Icon name="caretDown" />
      </button>

      {isSessionShown && (
        <Tooltip
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

      <AnimatePresence>
        {isModelMenuOpen && <ModelPopover key="model" at="composer" />}
      </AnimatePresence>
    </div>
  );
};

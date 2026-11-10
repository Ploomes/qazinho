import { AnimatePresence, motion } from 'motion/react';
import { Chat } from '@/modules/Chat';
import {
  TargetChip,
  WorkspaceName,
} from '@/modules/Workspace/screens/Workspace/components';
import { Icon, Kbd } from '@/shared/components/atoms';
import { ErrorBarrier } from '@/shared/components/organisms';
import { MOTION } from '@/shared/constants';
import { useAgentPanelViewModel } from './hooks';
import './styles.css';

/** O painel do agente à direita: o chat do workspace, recolhível e redimensionável. */
export const AgentPanel: React.FC = () => {
  const {
    hasWorkspace,
    isChatOnly,
    name,
    onRename,
    isOpen,
    title,
    railLabel,
    width,
    outerWidth,
    className,
    widthTransition,
    style,
    hideLabel,
    showLabel,
    collapseLabel,
    collapseCombo,
    onToggle,
    onResize,
    onResizeStart,
    onResizeEnd,
  } = useAgentPanelViewModel();

  if (!hasWorkspace) return null;

  return (
    <motion.aside
      className={className}
      style={style}
      initial={false}
      animate={{ width: outerWidth }}
      transition={widthTransition}
    >
      <AnimatePresence initial={false}>
        {!isOpen && (
          <motion.button
            key="rail"
            type="button"
            className="agent-panel__rail"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: MOTION.duration, delay: 0.08 },
            }}
            exit={{ opacity: 0, transition: { duration: MOTION.durationFast } }}
            aria-label={showLabel}
            onClick={onToggle}
          >
            <span className="agent-panel__mirror">
              <Icon name="sidebar" />
            </span>
            <span>{railLabel}</span>
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            key="panel"
            className="agent-panel__open"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: MOTION.duration, delay: 0.08 },
            }}
            exit={{ opacity: 0, transition: { duration: MOTION.durationFast } }}
          >
            <motion.div
              className="agent-panel__handle"
              drag="x"
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={{ left: 0, right: 0 }}
              onDragStart={onResizeStart}
              onDragEnd={onResizeEnd}
              onDrag={(_, info) => {
                onResize(width - info.delta.x);
              }}
            />

            <div className="agent-panel__inner">
              <header className="agent-panel__header">
                {isChatOnly ? (
                  <>
                    <WorkspaceName name={name} onRename={onRename} />
                    <TargetChip />
                  </>
                ) : (
                  <>
                    <span className="agent-panel__title">{title}</span>
                    <button
                      type="button"
                      className="agent-panel__collapse"
                      aria-label={hideLabel}
                      onClick={onToggle}
                    >
                      {collapseLabel}
                      {collapseCombo !== '' && <Kbd combo={collapseCombo} />}
                    </button>
                  </>
                )}
              </header>

              <ErrorBarrier region="chat">
                <Chat />
              </ErrorBarrier>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

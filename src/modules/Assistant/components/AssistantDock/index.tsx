import { AnimatePresence } from 'motion/react';
import { AssistantButton, AssistantPanel } from './components';
import { useAssistantDockViewModel } from './hooks';
import './styles.css';

/**
 * The Estagiário in QAzinho's corner: a sticker with his face, and his little chat rising
 * above it.
 */
export const AssistantDock: React.FC = () => {
  const { isOpen, style } = useAssistantDockViewModel();

  return (
    <div className="assistant-dock" style={style}>
      <AnimatePresence>{isOpen && <AssistantPanel key="panel" />}</AnimatePresence>
      <AssistantButton />
    </div>
  );
};

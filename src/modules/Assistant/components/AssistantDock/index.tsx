import { AnimatePresence } from 'motion/react';
import { AssistantButton, AssistantPanel } from './components';
import { useAssistantDockViewModel } from './hooks';
import './styles.css';

/**
 * O Estagiário no canto do QAzinho: um sticker com o rosto dele, e o chatzinho dele
 * subindo acima.
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

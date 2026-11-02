import { AnimatePresence } from 'motion/react';
import { AssistantPanel } from './components';
import { useAssistantDockViewModel } from './hooks';
import './styles.css';

/**
 * O chatzinho do Estagiário, aberto logo abaixo do botão dele na barra de título, à
 * direita da janela.
 */
export const AssistantDock: React.FC = () => {
  const { isOpen, style } = useAssistantDockViewModel();

  return (
    <div className="assistant-dock" style={style}>
      <AnimatePresence>{isOpen && <AssistantPanel key="panel" />}</AnimatePresence>
    </div>
  );
};

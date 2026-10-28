import type { ISuiteRequestPaneProps } from './types';
import { SuiteChangeCard } from '@/modules/Automation/screens/Automation/components/SuiteChangeCard';
import { useSuiteRequestPaneViewModel } from './hooks';
import './styles.css';

/**
 * Um teste novo pedido ao agente, escolhido: o que o QA pediu, o caso do plano que ele
 * automatiza e onde ele vai, e o trabalho do agente nele.
 */
export const SuiteRequestPane: React.FC<ISuiteRequestPaneProps> = (props) => {
  const { eyebrow, title, text, from, where, card } = useSuiteRequestPaneViewModel(props);

  return (
    <aside className="suite-request-pane">
      <header className="suite-request-pane__head">
        <span className="suite-request-pane__eyebrow">{eyebrow}</span>
        <h2 className="suite-request-pane__title">{title}</h2>
        {text !== '' && <p className="suite-request-pane__text">{text}</p>}
        {from !== '' && <span className="suite-request-pane__meta">{from}</span>}
        <span className="suite-request-pane__meta">{where}</span>
      </header>

      <SuiteChangeCard
        key={card.change.id}
        change={card.change}
        notes={card.notes}
        agent={card.agent}
        onStop={card.onStop}
        onReview={card.onReview}
        onDiscard={card.onDiscard}
        onRetry={card.onRetry}
      />
    </aside>
  );
};

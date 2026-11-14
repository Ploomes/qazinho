import type { IPlanStrategyProps } from './types';
import { AnimatePresence } from 'motion/react';
import { Caret } from '@/shared/components/atoms';
import { Fold } from '@/shared/components/molecules';
import { usePlanStrategyViewModel } from './hooks';
import './styles.css';

/** A estratégia do plano numa linha que abre: o que cobre, deixa de fora e arrisca. */
export const PlanStrategy: React.FC<IPlanStrategyProps> = (props) => {
  const { label, summary, rows, isShown, isOpen, onToggle } =
    usePlanStrategyViewModel(props);

  return (
    isShown && (
      <section className="plan-strategy">
        <button
          type="button"
          className="plan-strategy__head"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <Caret isOpen={isOpen} />
          <span className="plan-strategy__label">{label}</span>
          <span className="plan-strategy__summary">{summary}</span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <Fold key="rows" className="plan-strategy__body">
              <dl className="plan-strategy__rows">
                {rows.map((row) => (
                  <div key={row.key} className="plan-strategy__row">
                    <dt className="plan-strategy__name">{row.label}</dt>
                    <dd className="plan-strategy__text">{row.text}</dd>
                  </div>
                ))}
              </dl>
            </Fold>
          )}
        </AnimatePresence>
      </section>
    )
  );
};

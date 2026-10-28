import type { ISuiteRequestsProps } from './types';
import { Eyebrow, Icon } from '@/shared/components/atoms';
import { useSuiteRequestsViewModel } from './hooks';
import './styles.css';

/**
 * Os testes novos pedidos ao agente, acima dos da própria suíte, cada um com como está.
 */
export const SuiteRequests: React.FC<ISuiteRequestsProps> = (props) => {
  const { isShown, label, rows } = useSuiteRequestsViewModel(props);

  if (!isShown) return null;

  return (
    <section className="suite-requests">
      <Eyebrow>{label}</Eyebrow>
      <ul className="suite-requests__rows">
        {rows.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              className={row.className}
              aria-current={row.isPicked}
              onClick={row.onPick}
            >
              <span className={row.stateClassName}>
                <Icon name={row.icon} label={row.word} />
              </span>
              <span className="suite-requests__title">{row.title}</span>
              <span className="suite-requests__word">{row.word}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

import type { IErrorBlockProps } from './types';
import { Button, Caret, Eyebrow, Intern } from '@/shared/components/atoms';
import { useErrorBlockViewModel } from './hooks';
import './styles.css';

/**
 * Uma ferramenta quebrada nunca é resultado de teste: este bloco nunca pode parecer um
 * veredito.
 */
export const ErrorBlock: React.FC<IErrorBlockProps> = (props) => {
  const {
    kicker,
    text,
    fix,
    detail,
    hasDetail,
    isExpanded,
    toggleLabel,
    canRetry,
    retryLabel,
    modelLabel,
    onRetry,
    onModel,
    onToggle,
  } = useErrorBlockViewModel(props);

  return (
    <div className="error-block">
      <Intern mood="broken" size={44} />
      <div className="error-block__body">
        <Eyebrow>{kicker}</Eyebrow>
        <p className="error-block__text">{text}</p>
        {fix !== null && <span className="error-block__fix">{fix}</span>}
        {canRetry && (
          <div className="error-block__actions">
            <Button size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={onModel}>
              {modelLabel}
            </Button>
          </div>
        )}

        {hasDetail && (
          <>
            <button
              type="button"
              className="error-block__toggle"
              aria-expanded={isExpanded}
              onClick={onToggle}
            >
              <Caret isOpen={isExpanded} />
              {toggleLabel}
            </button>
            {isExpanded && <pre className="error-block__detail">{detail}</pre>}
          </>
        )}
      </div>
    </div>
  );
};

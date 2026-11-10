import type { IBrokenRegionProps } from './types';
import { Button, Caret, Intern } from '@/shared/components/atoms';
import { useBrokenRegionViewModel } from './hooks';
import './styles.css';

/** Uma região que quebrou: o que houve, recarregar, copiar o erro e o detalhe dobrado. */
export const BrokenRegion: React.FC<IBrokenRegionProps> = (props) => {
  const view = useBrokenRegionViewModel(props);

  return (
    <div className={view.className} role="alert">
      <Intern mood="broken" size={56} />
      <h2 className="broken-region__title">{view.title}</h2>
      <p className="broken-region__text">{view.text}</p>
      <div className="broken-region__actions">
        <Button variant="primary" onClick={view.onRetry}>
          {view.retryLabel}
        </Button>
        <Button variant="ghost" onClick={view.onCopy}>
          {view.copyLabel}
        </Button>
      </div>
      <button
        type="button"
        className="broken-region__toggle"
        aria-expanded={view.isOpen}
        onClick={view.onToggle}
      >
        <Caret isOpen={view.isOpen} />
        {view.detailsLabel}
      </button>
      {view.isOpen && <pre className="broken-region__detail">{view.detail}</pre>}
    </div>
  );
};

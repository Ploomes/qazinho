import { Button, Icon, Input, StatusPill } from '@/shared/components/atoms';
import { useManualPanelViewModel } from './hooks';
import './styles.css';

/**
 * A vez do QA num caso à mão: como o caso foi preparado, o passo em que ele está e o que
 * se espera, e como marcá-lo, digitar uma variável ou terminar.
 */
export const ManualPanel: React.FC = () => {
  const view = useManualPanelViewModel();

  return (
    <section className="manual-panel" aria-label={view.title}>
      <header className="manual-panel__head">
        <span className="manual-panel__title">
          <Icon name="manual" />
          {view.title}
        </span>
        <Button size="sm" variant="ghost" onClick={view.onEnd}>
          {view.endLabel}
        </Button>
      </header>

      {view.prep !== null && <p className="manual-panel__prep">{view.prep}</p>}

      <ol className="manual-panel__steps">
        {view.steps.map((step) => (
          <li
            key={step.key}
            className={
              step.isNow
                ? 'manual-panel__step manual-panel__step--now'
                : 'manual-panel__step'
            }
          >
            <StatusPill status={step.status} label="" />
            <span className="manual-panel__number">{step.number}</span>
            <span className="manual-panel__body">
              <span className="manual-panel__action">{step.action}</span>
              {step.isNow && step.expected !== '' && (
                <span className="manual-panel__expected">
                  <span className="manual-panel__prefix">{view.expectedPrefix}</span>{' '}
                  {step.expected}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      <p className="manual-panel__hint">{view.hint}</p>

      <Input
        label={view.notePlaceholder}
        placeholder={view.notePlaceholder}
        value={view.note}
        onChange={view.onNote}
      />

      <div className="manual-panel__marks">
        <Button size="sm" disabled={!view.canMark} onClick={view.onPassed}>
          <Icon name="check" />
          {view.passedLabel}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!view.canMark}
          onClick={view.onFailed}
        >
          <Icon name="close" />
          {view.failedLabel}
        </Button>
        <Button size="sm" variant="ghost" disabled={!view.canMark} onClick={view.onSkip}>
          {view.skipLabel}
        </Button>
      </div>

      {view.hasVariables && (
        <div className="manual-panel__variables">
          <Button size="sm" variant="ghost" onClick={view.onPickVariable}>
            {view.variableLabel}
          </Button>
          {view.isPicking && (
            <span className="manual-panel__names">
              {view.variables.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  className="manual-panel__name"
                  onClick={variable.onPick}
                >
                  {variable.name}
                </button>
              ))}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

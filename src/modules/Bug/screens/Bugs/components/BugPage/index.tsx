import type { IBugPageProps } from './types';
import { Trans, useTranslation } from 'react-i18next';
import { Button, Icon } from '@/shared/components/atoms';
import { Screenshot } from '@/shared/components/molecules';
import { BugUpdate, MomentTile } from './components';
import { useBugPageViewModel } from './hooks';
import './styles.css';

/**
 * Um bug que se lê em segundos: o que quebrou, onde, o esperado e o que veio, a tela
 * grande e os passos até ele.
 */
export const BugPage: React.FC<IBugPageProps> = (props) => {
  const {
    style,
    backLabel,
    metaKey,
    metaValues,
    caseTitle,
    expectedLabel,
    gotLabel,
    hero,
    design,
    realLabel,
    evidenceClass,
    thumbs,
    steps,
    stepsToggle,
    onStepsToggle,
    failedHere,
    moment,
    shotsStyle,
    filedKey,
    frameLabel,
    sendLabel,
    issueLabel,
    canCopyScreen,
    copyLabel,
    onBack,
    onRunClick,
    onCaseClick,
    onFrameClick,
    onSendClick,
    isTrackerShown,
    dismissLabel,
    onDismissClick,
    onIssueClick,
    onCopyScreen,
    onOpenShot,
  } = useBugPageViewModel(props);
  const { bug } = props;
  const { t } = useTranslation();

  return (
    <article className="bug-page" style={style}>
      <button type="button" className="bug-page__back" onClick={onBack}>
        <Icon name="back" />
        {backLabel}
      </button>

      <header className="bug-page__head">
        <h2 className="bug-page__title">{bug.title}</h2>
        <div className="bug-page__actions">
          <Button size="sm" variant="ghost" onClick={onDismissClick}>
            {dismissLabel}
          </Button>
          {isTrackerShown && (
            <>
              {filedKey === null ? (
                <Button size="sm" variant="primary" onClick={onSendClick}>
                  {sendLabel}
                </Button>
              ) : (
                <>
                  {canCopyScreen && (
                    <Button size="sm" onClick={onCopyScreen}>
                      {copyLabel}
                    </Button>
                  )}
                  <Button size="sm" onClick={onIssueClick}>
                    {issueLabel}
                    <Icon name="external" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      <p className="bug-page__meta">
        <Trans
          i18nKey={metaKey}
          values={metaValues}
          components={{
            run: props.hasRun ? (
              <button type="button" className="bug-page__link" onClick={onRunClick} />
            ) : (
              <span />
            ),
            case: props.hasCase ? (
              <button
                type="button"
                className="bug-page__link"
                title={caseTitle}
                onClick={onCaseClick}
              />
            ) : (
              <span title={caseTitle} />
            ),
          }}
        />
        {frameLabel !== null && (
          <button
            type="button"
            className="bug-page__link bug-page__frame"
            onClick={onFrameClick}
          >
            {frameLabel}
            <Icon name="external" />
          </button>
        )}
      </p>

      <BugUpdate workspaceId={props.workspaceId} bug={bug} />

      <dl className="bug-page__facts">
        <dt className="bug-page__fact-label">{expectedLabel}</dt>
        <dd className="bug-page__fact">{bug.expected}</dd>
        <dt className="bug-page__fact-label">{gotLabel}</dt>
        <dd className="bug-page__fact">{bug.got}</dd>
      </dl>

      {hero !== null && (
        <div className={evidenceClass}>
          <span className="bug-page__hero">
            <Screenshot
              label={hero.label}
              src={hero.src}
              file={hero.file}
              isBad={false}
              size="hero"
              onOpen={() => {
                onOpenShot(hero);
              }}
            />
            {design !== null && <span className="bug-page__caption">{realLabel}</span>}
          </span>
          {design !== null && (
            <span className="bug-page__hero">
              <Screenshot
                label={design.label}
                src={design.src}
                file={design.file}
                isBad={false}
                size="hero"
                onOpen={() => {
                  onOpenShot(design);
                }}
              />
              <span className="bug-page__caption">{design.label}</span>
            </span>
          )}
          {(thumbs.length > 0 || moment !== null) && (
            <div className="bug-page__thumbs" style={shotsStyle}>
              {thumbs.map((shot) => (
                <Screenshot
                  key={shot.label}
                  label={shot.label}
                  src={shot.src}
                  file={shot.file}
                  isBad={false}
                  size="shot"
                  onOpen={() => {
                    onOpenShot(shot);
                  }}
                />
              ))}
              {moment !== null && <MomentTile bugId={bug.id} moment={moment} />}
            </div>
          )}
        </div>
      )}

      <section className="bug-page__section">
        <h3 className="bug-page__label">{t('BUG.HOW_TO')}</h3>
        <ol className="bug-page__steps">
          {steps.map((step) => (
            <li
              key={step.number}
              className={
                step.isBad ? 'bug-page__step bug-page__step--bad' : 'bug-page__step'
              }
            >
              <span className="bug-page__step-number">{step.number}</span>
              <span>
                {step.action}
                {step.isBad && (
                  <span className="bug-page__failed-here">{failedHere}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
        {stepsToggle !== null && (
          <button type="button" className="bug-page__more" onClick={onStepsToggle}>
            {stepsToggle}
          </button>
        )}
      </section>
    </article>
  );
};

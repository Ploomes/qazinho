import { ProjectMark } from '@/modules/Project';
import {
  Button,
  Icon,
  IconButton,
  Intern,
  PlatformIcon,
} from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { useFirstRunViewModel } from './hooks';
import './styles.css';

/**
 * O app antes do primeiro projeto: qual app o QA vai testar e o que testar primeiro, que
 * criam o projeto e o primeiro plano.
 */
export const FirstRun: React.FC = () => {
  const {
    style,
    settingsLabel,
    onSettings,
    isAppStep,
    internSize,
    appTitle,
    appLead,
    appPlaceholder,
    appLabel,
    typed,
    onTypedChange,
    onFieldKey,
    hasBuild,
    buildKind,
    buildName,
    useAddressLabel,
    onClearBuild,
    hasProblem,
    problem,
    continueLabel,
    onContinue,
    pickApkLabel,
    onPickApk,
    canPickApp,
    pickAppLabel,
    onPickApp,
    markSize,
    targetMark,
    targetPlace,
    planTitle,
    planLead,
    planPlaceholder,
    ask,
    onAskChange,
    onAskKey,
    examplesTitle,
    examples,
    canStart,
    startLabel,
    onStart,
    exploreLabel,
    onExplore,
    backLabel,
    onBack,
    isAgentReady,
    agentLine,
  } = useFirstRunViewModel();

  return (
    <section className="first-run" style={style}>
      <span className="first-run__settings">
        <Tooltip content={settingsLabel}>
          <IconButton icon="settings" label={settingsLabel} onClick={onSettings} />
        </Tooltip>
      </span>

      <div className="first-run__column">
        {isAppStep ? (
          <div className="first-run__step">
            <Intern mood="neutral" size={internSize} />
            <h1 className="first-run__title">{appTitle}</h1>
            <p className="first-run__lead">{appLead}</p>

            {hasBuild ? (
              <div className="first-run__build">
                <PlatformIcon kind={buildKind} size={16} />
                <span className="first-run__build-name">{buildName}</span>
                <button type="button" className="first-run__link" onClick={onClearBuild}>
                  {useAddressLabel}
                </button>
              </div>
            ) : (
              <input
                className="first-run__field"
                value={typed}
                placeholder={appPlaceholder}
                aria-label={appLabel}
                spellCheck={false}
                autoFocus
                onChange={(event) => {
                  onTypedChange(event.target.value);
                }}
                onKeyDown={onFieldKey}
              />
            )}

            {hasProblem && (
              <p className="first-run__problem" role="alert">
                {problem}
              </p>
            )}

            <div className="first-run__actions">
              <Button variant="primary" onClick={onContinue}>
                {continueLabel}
              </Button>
              <button type="button" className="first-run__link" onClick={onPickApk}>
                {pickApkLabel}
              </button>
              {canPickApp && (
                <button type="button" className="first-run__link" onClick={onPickApp}>
                  {pickAppLabel}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="first-run__step">
            <span className="first-run__target">
              <ProjectMark mark={targetMark} size={markSize} />
              {targetPlace}
            </span>
            <h1 className="first-run__title">{planTitle}</h1>
            <p className="first-run__lead">{planLead}</p>

            <textarea
              className="first-run__field first-run__field--area"
              value={ask}
              placeholder={planPlaceholder}
              aria-label={planTitle}
              autoFocus
              onChange={(event) => {
                onAskChange(event.target.value);
              }}
              onKeyDown={onAskKey}
            />

            <div className="first-run__examples">
              <span className="first-run__examples-title">{examplesTitle}</span>
              {examples.map((example) => (
                <button
                  key={example.key}
                  type="button"
                  className="first-run__example"
                  onClick={example.onPick}
                >
                  <Icon name="arrow" />
                  {example.label}
                </button>
              ))}
            </div>

            <div className="first-run__actions">
              <Button variant="primary" disabled={!canStart} onClick={onStart}>
                {startLabel}
              </Button>
              <button type="button" className="first-run__link" onClick={onExplore}>
                {exploreLabel}
              </button>
              <button
                type="button"
                className="first-run__link first-run__link--quiet"
                onClick={onBack}
              >
                {backLabel}
              </button>
            </div>
          </div>
        )}

        <p
          className={
            isAgentReady
              ? 'first-run__agent'
              : 'first-run__agent first-run__agent--missing'
          }
        >
          <Icon name={isAgentReady ? 'check' : 'attention'} />
          {agentLine}
          {!isAgentReady && (
            <button type="button" className="first-run__link" onClick={onSettings}>
              {settingsLabel}
            </button>
          )}
        </p>
      </div>
    </section>
  );
};

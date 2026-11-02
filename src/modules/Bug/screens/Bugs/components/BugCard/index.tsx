import type { IBugCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button, Caret, Icon } from '@/shared/components/atoms';
import { ExpectedGot, MetaGrid, Screenshot } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { BugUpdate, MomentTile } from './components';
import { useBugCardViewModel } from './hooks';
import './styles.css';

/**
 * Um bug, dobrado no título, ou aberto com onde foi pego e as ações, o que se esperava e
 * o que veio, a tela, os passos até ele, e como foi achado.
 */
export const BugCard: React.FC<IBugCardProps> = (props) => {
  const {
    severity,
    meta,
    provenance,
    hero,
    thumbs,
    steps,
    stepsToggle,
    onStepsToggle,
    failedHere,
    isDetailsOpen,
    onDetailsToggle,
    moment,
    shotsStyle,
    newLabel,
    filedKey,
    updateChip,
    frameLabel,
    sendLabel,
    issueLabel,
    canCopyScreen,
    copyLabel,
    onHeadClick,
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
  } = useBugCardViewModel(props);
  const { bug } = props;
  const { t } = useTranslation();

  return (
    <article className="bug-card">
      <button type="button" className="bug-card__head" onClick={onHeadClick}>
        <span
          className={
            bug.isNew
              ? 'bug-card__severity bug-card__severity--new'
              : 'bug-card__severity'
          }
          title={newLabel}
        />
        <span className="bug-card__title">{bug.title}</span>
        <span className="bug-card__id">{bug.id}</span>
        {updateChip !== null && (
          <span className={updateChip.className}>{updateChip.label}</span>
        )}
        {filedKey !== null && (
          <span className="bug-card__filed">
            <Icon name="link" />
            {filedKey}
          </span>
        )}
        <span className="bug-card__level">{severity}</span>
        <Caret isOpen={props.isOpen} />
      </button>

      <AnimatePresence initial={false}>
        {props.isOpen && (
          <motion.div
            key="body"
            className="bug-card__reveal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
          >
            <div className="bug-card__body">
              <BugUpdate workspaceId={props.workspaceId} bug={bug} />

              <div className="bug-card__top">
                <p className="bug-card__where">
                  {props.hasCase ? (
                    <button
                      type="button"
                      className="bug-card__link"
                      title={provenance.caseTitle}
                      onClick={onCaseClick}
                    >
                      {provenance.place}
                    </button>
                  ) : (
                    <span className="bug-card__case" title={provenance.caseTitle}>
                      {provenance.place}
                    </span>
                  )}
                  {provenance.run !== null && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        className="bug-card__link"
                        onClick={onRunClick}
                      >
                        {provenance.run}
                      </button>
                    </>
                  )}
                  {provenance.seen !== null && (
                    <>
                      {' · '}
                      {provenance.seen}
                    </>
                  )}
                  {frameLabel !== null && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        className="bug-card__link"
                        onClick={onFrameClick}
                      >
                        <Icon name="figma" />
                        {frameLabel}
                        <Icon name="external" />
                      </button>
                    </>
                  )}
                </p>
                <div className="bug-card__actions">
                  <Button size="sm" variant="ghost" onClick={onDismissClick}>
                    {dismissLabel}
                  </Button>
                  {isTrackerShown && (
                    <>
                      {filedKey === null ? (
                        <Button size="sm" variant="primary" onClick={onSendClick}>
                          <Icon name="send" />
                          {sendLabel}
                        </Button>
                      ) : (
                        <>
                          {canCopyScreen && (
                            <Button size="sm" onClick={onCopyScreen}>
                              <Icon name="copy" />
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
              </div>

              <ExpectedGot isBug expected={bug.expected} got={bug.got} />

              {hero !== null && (
                <div className="bug-card__evidence">
                  <span className="bug-card__hero">
                    <Screenshot
                      label={hero.label}
                      src={hero.src}
                      file={hero.file}
                      isBad={hero.isBad}
                      size="hero"
                      onOpen={() => {
                        onOpenShot(hero);
                      }}
                    />
                  </span>
                  <div className="bug-card__thumbs" style={shotsStyle}>
                    {thumbs.map((shot) => (
                      <Screenshot
                        key={shot.label}
                        label={shot.label}
                        src={shot.src}
                        file={shot.file}
                        isBad={shot.isBad}
                        size="shot"
                        onOpen={() => {
                          onOpenShot(shot);
                        }}
                      />
                    ))}
                    {moment !== null && <MomentTile bugId={bug.id} moment={moment} />}
                  </div>
                </div>
              )}

              <div className="bug-card__steps-block">
                <span className="bug-card__label">{t('BUG.HOW_TO')}</span>
                <ol className="bug-card__steps">
                  {steps.map((step) => (
                    <li
                      key={step.number}
                      className={
                        step.isBad
                          ? 'bug-card__step bug-card__step--bad'
                          : 'bug-card__step'
                      }
                    >
                      <span className="bug-card__step-number">
                        {step.isBad ? <Icon name="failed" /> : step.number}
                      </span>
                      <span>
                        {step.action}
                        {step.isBad && (
                          <span className="bug-card__failed-here"> · {failedHere}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
                {stepsToggle !== null && (
                  <button
                    type="button"
                    className="bug-card__more"
                    onClick={onStepsToggle}
                  >
                    {stepsToggle}
                  </button>
                )}
              </div>

              <div className="bug-card__details">
                <button
                  type="button"
                  className="bug-card__details-toggle"
                  aria-expanded={isDetailsOpen}
                  onClick={onDetailsToggle}
                >
                  <Caret isOpen={isDetailsOpen} />
                  {t('BUG.WHERE')}
                </button>
                <AnimatePresence initial={false}>
                  {isDetailsOpen && (
                    <motion.div
                      key="details"
                      className="bug-card__details-fold"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                    >
                      <div className="bug-card__details-body">
                        <MetaGrid rows={meta} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};

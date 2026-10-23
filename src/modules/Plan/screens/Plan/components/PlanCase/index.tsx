import type { IPlanCaseProps } from './types';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Caret, EditableText, Icon, StatusPill } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import { usePlanCaseViewModel } from './hooks';
import './styles.css';

export const PlanCase: React.FC<IPlanCaseProps> = ({ ref, ...props }) => {
  const {
    summary,
    priority,
    expectLabel,
    className,
    steps,
    verdict,
    isTitleFocused,
    canRemoveStep,
    onHeadClick,
    moveLabel,
    onHeadKeyDown,
    onFieldCommit,
    onStepCommit,
    onStepAdd,
    onStepRemove,
    onCaseRemove,
    onPickUp,
    onPutDown,
  } = usePlanCaseViewModel(props);
  const { t } = useTranslation();

  return (
    <Reorder.Item
      ref={ref}
      value={props.testCase}
      className={className}
      layout="position"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: MOTION.duration, ease: MOTION.ease },
      }}
      exit={{
        opacity: 0,
        scale: 0.98,
        transition: { duration: MOTION.durationFast, ease: MOTION.easeIn },
      }}
      dragListener={!props.isLocked}
      whileDrag={STICKER.drag}
      onDragStart={onPickUp}
      onDragEnd={onPutDown}
    >
      <div className="plan-case__head">
        <button
          type="button"
          className="plan-case__open"
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
          aria-description={moveLabel}
          onClick={onHeadClick}
          onKeyDown={onHeadKeyDown}
        >
          <span
            className={
              props.isLocked
                ? 'plan-case__handle plan-case__handle--locked'
                : 'plan-case__handle'
            }
            aria-hidden="true"
          >
            <Icon name="drag" />
          </span>
          <Caret isOpen={props.isOpen} />
          <span className="plan-case__id">{props.testCase.id}</span>
        </button>

        <EditableText
          value={props.testCase.title}
          placeholder={t('PLAN.TITLE_PLACEHOLDER')}
          isLocked={props.isLocked}
          isTitle
          isAutoFocused={isTitleFocused}
          onCommit={(title) => {
            onFieldCommit({ title });
          }}
        />

        {priority !== null && <span className="plan-case__priority">{priority}</span>}
        <StatusPill status={verdict} />

        {!props.isLocked && (
          <button
            type="button"
            className="plan-case__remove"
            aria-label={t('PLAN.REMOVE_CASE')}
            onClick={onCaseRemove}
          >
            <Icon name="close" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {props.isOpen && (
          <motion.div
            key="body"
            className="plan-case__reveal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="plan-case__body">
              {summary !== null && (
                <p className={`plan-case__summary plan-case__summary--${summary.tone}`}>
                  <Icon name={summary.tone} />
                  <span className="plan-case__summary-text">{summary.text}</span>
                  {summary.note !== null && (
                    <span className="plan-case__summary-note">{summary.note}</span>
                  )}
                </p>
              )}

              <dl className="plan-case__meta">
                <dt className="plan-case__label">{t('PLAN.GOAL')}</dt>
                <dd className="plan-case__field">
                  <EditableText
                    value={props.testCase.goal}
                    placeholder={t('PLAN.GOAL_PLACEHOLDER')}
                    isLocked={props.isLocked}
                    onCommit={(goal) => {
                      onFieldCommit({ goal });
                    }}
                  />
                </dd>
                <dt className="plan-case__label">{t('PLAN.BEFORE')}</dt>
                <dd className="plan-case__field">
                  <EditableText
                    value={props.testCase.preconditions}
                    placeholder={t('PLAN.BEFORE_PLACEHOLDER')}
                    isLocked={props.isLocked}
                    onCommit={(preconditions) => {
                      onFieldCommit({ preconditions });
                    }}
                  />
                </dd>
              </dl>

              <ol className="plan-case__steps">
                {steps.map((step) => (
                  <li key={step.number} className="plan-case__step">
                    <span className="plan-case__step-number">{step.number}</span>
                    <div className="plan-case__step-body">
                      <span className="plan-case__action">
                        <EditableText
                          value={step.action}
                          placeholder={t('PLAN.ACTION_PLACEHOLDER')}
                          isLocked={props.isLocked}
                          isAutoFocused={step.isFresh}
                          onCommit={(action) => {
                            onStepCommit({ index: step.number - 1, step: { action } });
                          }}
                        />
                      </span>
                      <span className="plan-case__expected">
                        <span className="plan-case__expect-label">{expectLabel}</span>
                        <EditableText
                          value={step.expected}
                          placeholder={t('PLAN.EXPECTED_PLACEHOLDER')}
                          isLocked={props.isLocked}
                          onCommit={(expected) => {
                            onStepCommit({ index: step.number - 1, step: { expected } });
                          }}
                        />
                      </span>
                      {step.frame !== null && (
                        <a
                          className="plan-case__frame"
                          href={step.frame.url}
                          target="_blank"
                          rel="noreferrer"
                          title={step.frame.title}
                        >
                          <Icon name="figma" />
                          {step.frame.label}
                          <Icon name="external" />
                        </a>
                      )}
                    </div>
                    {step.isVerdictShown && (
                      <span
                        className={`plan-case__verdict plan-case__verdict--${step.verdict}`}
                      >
                        <Icon name={step.verdictIcon} /> {step.verdictLabel}
                      </span>
                    )}
                    {canRemoveStep && (
                      <button
                        type="button"
                        className="plan-case__remove plan-case__remove--step"
                        aria-label={t('PLAN.REMOVE_STEP', { number: step.number })}
                        onClick={() => {
                          onStepRemove(step.number - 1);
                        }}
                      >
                        <Icon name="close" />
                      </button>
                    )}
                  </li>
                ))}
              </ol>

              {!props.isLocked && (
                <button type="button" className="plan-case__add" onClick={onStepAdd}>
                  {t('PLAN.ADD_STEP')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
};

import type { IPlanCaseProps } from './types';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Caret, EditableText, Icon, StatusPill } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import { usePlanCaseViewModel } from './hooks';
import './styles.css';

export const PlanCase: React.FC<IPlanCaseProps> = ({ ref, ...props }) => {
  const {
    outcome,
    priority,
    expectLabel,
    className,
    steps,
    verdict,
    isGoalShown,
    isBeforeShown,
    isGoalFocused,
    isBeforeFocused,
    canAddGoal,
    canAddBefore,
    isTitleFocused,
    canRemoveStep,
    onHeadClick,
    runCaseLabel,
    moveLabel,
    onHeadKeyDown,
    onFieldCommit,
    onFactAdd,
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
        height: 0,
        transition: { duration: MOTION.durationSlow, ease: MOTION.ease },
      }}
      dragListener={!props.isLocked}
      whileDrag={STICKER.drag}
      onDragStart={onPickUp}
      onDragEnd={onPutDown}
    >
      <div className="plan-case__head">
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

        <StatusPill status={verdict} label="" />

        <button
          type="button"
          className="plan-case__open"
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
          aria-description={moveLabel}
          onClick={onHeadClick}
          onKeyDown={onHeadKeyDown}
        >
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

        <span className="plan-case__aside">
          {props.isDeveloped === true && (
            <span
              className="plan-case__developed"
              title={t('PLAN.DEVELOPED_TIP')}
              aria-label={t('PLAN.DEVELOPED_TIP')}
            >
              <Icon name="recorded" />
            </span>
          )}

          {priority !== null && <span className="plan-case__priority">{priority}</span>}

          {!props.isLocked && (
            <span className="plan-case__actions">
              {props.onRunCase !== undefined && (
                <button
                  type="button"
                  className="plan-case__run"
                  aria-label={runCaseLabel}
                  title={runCaseLabel}
                  onClick={() => {
                    props.onRunCase?.(props.testCase.id);
                  }}
                >
                  <Icon name="play" />
                </button>
              )}
            </span>
          )}
        </span>
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
              {(isGoalShown || isBeforeShown) && (
                <dl className="plan-case__facts">
                  {isGoalShown && (
                    <div className="plan-case__fact">
                      <dt className="plan-case__label">{t('PLAN.GOAL')}</dt>
                      <dd className="plan-case__field">
                        <EditableText
                          value={props.testCase.goal}
                          placeholder={t('PLAN.GOAL_PLACEHOLDER')}
                          isLocked={props.isLocked}
                          isAutoFocused={isGoalFocused}
                          onCommit={(goal) => {
                            onFieldCommit({ goal });
                          }}
                        />
                      </dd>
                    </div>
                  )}
                  {isBeforeShown && (
                    <div className="plan-case__fact">
                      <dt className="plan-case__label">{t('PLAN.BEFORE')}</dt>
                      <dd className="plan-case__field">
                        <EditableText
                          value={props.testCase.preconditions}
                          placeholder={t('PLAN.BEFORE_PLACEHOLDER')}
                          isLocked={props.isLocked}
                          isAutoFocused={isBeforeFocused}
                          onCommit={(preconditions) => {
                            onFieldCommit({ preconditions });
                          }}
                        />
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {(canAddGoal || canAddBefore) && (
                <div className="plan-case__ghosts">
                  {canAddGoal && (
                    <button
                      type="button"
                      className="plan-case__ghost"
                      onClick={() => {
                        onFactAdd('goal');
                      }}
                    >
                      <Icon name="plus" />
                      {t('PLAN.ADD_GOAL')}
                    </button>
                  )}
                  {canAddBefore && (
                    <button
                      type="button"
                      className="plan-case__ghost"
                      onClick={() => {
                        onFactAdd('before');
                      }}
                    >
                      <Icon name="plus" />
                      {t('PLAN.ADD_BEFORE')}
                    </button>
                  )}
                </div>
              )}

              <div className="plan-case__steps-block">
                <div className="plan-case__steps-head">
                  <span className="plan-case__label plan-case__title">
                    {t('PLAN.STEPS_LABEL')}
                    <span className="plan-case__count">{steps.length}</span>
                  </span>
                  <span className="plan-case__label plan-case__column plan-case__column--action">
                    {t('PLAN.COLUMN_ACTION')}
                  </span>
                  <span className="plan-case__label plan-case__column plan-case__column--expected">
                    {expectLabel}
                  </span>
                  {outcome !== null && (
                    <span
                      className={`plan-case__outcome plan-case__outcome--${outcome.tone}`}
                    >
                      {outcome.text !== null && (
                        <>
                          <Icon name={outcome.tone} />
                          {outcome.text}
                        </>
                      )}
                      {outcome.note !== null && (
                        <span
                          className="plan-case__note"
                          title={outcome.noteTip ?? undefined}
                          aria-label={outcome.noteTip ?? undefined}
                        >
                          <Icon name={outcome.note} />
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <ol className="plan-case__steps">
                  {steps.map((step) => (
                    <li
                      key={step.number}
                      className={`plan-case__step plan-case__step--${step.verdict}`}
                    >
                      <span className="plan-case__step-number">{step.number}</span>
                      <div className="plan-case__action">
                        <EditableText
                          value={step.action}
                          placeholder={t('PLAN.ACTION_PLACEHOLDER')}
                          isLocked={props.isLocked}
                          isAutoFocused={step.isFresh}
                          onCommit={(action) => {
                            onStepCommit({ index: step.number - 1, step: { action } });
                          }}
                        />
                      </div>
                      <div className="plan-case__expected">
                        <span className="plan-case__expect-icon" title={expectLabel}>
                          <Icon name="eye" />
                        </span>
                        <div className="plan-case__expected-body">
                          <EditableText
                            value={step.expected}
                            placeholder={t('PLAN.EXPECTED_PLACEHOLDER')}
                            isLocked={props.isLocked}
                            onCommit={(expected) => {
                              onStepCommit({
                                index: step.number - 1,
                                step: { expected },
                              });
                            }}
                          />
                          {(step.isVerdictShown || step.frame !== null) && (
                            <div className="plan-case__marks">
                              {step.isVerdictShown && (
                                <span
                                  className={`plan-case__verdict plan-case__verdict--${step.verdict}`}
                                >
                                  <Icon name={step.verdictIcon} /> {step.verdictLabel}
                                </span>
                              )}
                              {step.hasBug && (
                                <button
                                  type="button"
                                  className="plan-case__bug"
                                  onClick={step.onBugClick}
                                >
                                  {step.bugId}
                                  <Icon name="arrow" />
                                </button>
                              )}
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
                          )}
                          {step.hasWhy && <p className="plan-case__why">{step.why}</p>}
                        </div>
                      </div>
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
                  <div className="plan-case__foot">
                    <button
                      type="button"
                      className="plan-case__ghost plan-case__add"
                      onClick={onStepAdd}
                    >
                      <Icon name="plus" />
                      {t('PLAN.ADD_STEP')}
                    </button>
                    <button
                      type="button"
                      className="plan-case__drop"
                      onClick={onCaseRemove}
                    >
                      {t('PLAN.REMOVE_CASE')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
};

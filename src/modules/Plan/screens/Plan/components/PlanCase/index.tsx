import type { IPlanCaseProps } from './types';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Caret, EditableText, Icon, StatusPill } from '@/shared/components/atoms';
import { MenuButton } from '@/shared/components/molecules';
import { MOTION, STICKER } from '@/shared/constants';
import { usePlanCaseViewModel } from './hooks';
import './styles.css';

export const PlanCase: React.FC<IPlanCaseProps> = ({ ref, ...props }) => {
  const {
    reason,
    reasonClassName,
    reasonTip,
    sources,
    priority,
    expectedPrefix,
    gotPrefix,
    seeBugLabel,
    notReachedLabel,
    className,
    steps,
    verdict,
    hasStatus,
    hasFacts,
    isGoalShown,
    isBeforeShown,
    isAccountShown,
    canPickAccount,
    accountLabel,
    accountItems,
    canAddAccount,
    isGoalFocused,
    isBeforeFocused,
    canAddGoal,
    canAddBefore,
    isTitleFocused,
    canRemoveStep,
    onHeadClick,
    runCaseLabel,
    runIcon,
    manualLabel,
    manualIcon,
    onManualToggle,
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

        <span className="plan-case__status">
          {hasStatus && <StatusPill status={verdict} label="" />}
        </span>

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
          {reason !== '' && (
            <span className={reasonClassName} title={reasonTip}>
              {reason}
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
                  <Icon name={runIcon} />
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
              {sources !== null && <p className="plan-case__sources">{sources}</p>}
              {hasFacts && (
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
                  {isAccountShown && (
                    <div className="plan-case__fact">
                      <dt className="plan-case__label">{t('PLAN.ACCOUNT')}</dt>
                      <dd className="plan-case__field plan-case__account">
                        {canPickAccount ? (
                          <MenuButton
                            label={accountLabel}
                            icon="account"
                            items={accountItems}
                          />
                        ) : (
                          <code className="plan-case__account-name">{accountLabel}</code>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {(canAddGoal || canAddBefore || canAddAccount) && (
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
                  {canAddAccount && (
                    <button
                      type="button"
                      className="plan-case__ghost"
                      onClick={() => {
                        onFactAdd('account');
                      }}
                    >
                      <Icon name="plus" />
                      {t('PLAN.ADD_ACCOUNT')}
                    </button>
                  )}
                </div>
              )}

              <div className="plan-case__steps-block">
                <ol className="plan-case__steps">
                  {steps.map((step) => (
                    <li
                      key={step.number}
                      className={`plan-case__step plan-case__step--${step.verdict}`}
                    >
                      <span className="plan-case__step-number">{step.number}</span>
                      <div className="plan-case__step-body">
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
                        {step.hasExpected && (
                          <div className="plan-case__expected">
                            <span className="plan-case__prefix">{expectedPrefix}</span>
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
                          </div>
                        )}
                        {step.isBad && (
                          <p className="plan-case__got">
                            {step.hasGotPrefix && (
                              <span className="plan-case__prefix">{gotPrefix}</span>
                            )}
                            {step.got}
                            {step.hasBug && ' '}
                            {step.hasBug && (
                              <button
                                type="button"
                                className="plan-case__bug"
                                onClick={step.onBugClick}
                              >
                                {seeBugLabel}
                                <Icon name="arrow" />
                              </button>
                            )}
                          </p>
                        )}
                        {step.isUnreached && (
                          <p className="plan-case__unreached">{notReachedLabel}</p>
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
                      className="plan-case__ghost plan-case__manual"
                      onClick={onManualToggle}
                    >
                      <Icon name={manualIcon} />
                      {manualLabel}
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

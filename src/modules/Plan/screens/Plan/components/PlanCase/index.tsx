import type { IPlanCaseProps } from './types';
import { Reorder } from 'motion/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { EditableText, StatusPill } from '@/components/atoms';
import { usePlanCaseViewModel } from './hooks';
import './styles.css';

export const PlanCase: React.FC<IPlanCaseProps> = (props) => {
  const {
    steps,
    caret,
    verdict,
    canRemoveStep,
    onHeadClick,
    onFieldCommit,
    onStepCommit,
    onStepAdd,
    onStepRemove,
    onCaseRemove,
  } = usePlanCaseViewModel(props);
  const { t } = useTranslation();

  return (
    <Reorder.Item
      value={props.testCase}
      className="plan-case"
      dragListener={!props.isLocked}
      whileDrag={{ scale: 1.012, zIndex: 6 }}
    >
      <div className="plan-case__head">
        <button type="button" className="plan-case__open" onClick={onHeadClick}>
          <span
            className={
              props.isLocked
                ? 'plan-case__handle plan-case__handle--locked'
                : 'plan-case__handle'
            }
            aria-hidden="true"
          >
            ⠿
          </span>
          <span aria-hidden="true">{caret}</span>
          <span className="plan-case__id">{props.testCase.id}</span>
        </button>

        <EditableText
          value={props.testCase.title}
          placeholder={t('PLAN.TITLE_PLACEHOLDER')}
          isLocked={props.isLocked}
          isTitle
          onCommit={(title) => {
            onFieldCommit({ title });
          }}
        />

        <span className="plan-case__priority">{props.testCase.priority}</span>
        <StatusPill status={verdict} />

        {!props.isLocked && (
          <button
            type="button"
            className="plan-case__remove"
            aria-label={t('PLAN.REMOVE_CASE')}
            onClick={onCaseRemove}
          >
            ✕
          </button>
        )}
      </div>

      {props.isOpen && (
        <div className="plan-case__body">
          <div className="plan-case__meta">
            <div>
              <span className="plan-case__label">{t('PLAN.GOAL')}</span>
              <EditableText
                value={props.testCase.goal}
                placeholder={t('PLAN.GOAL_PLACEHOLDER')}
                isLocked={props.isLocked}
                onCommit={(goal) => {
                  onFieldCommit({ goal });
                }}
              />
            </div>
            <div>
              <span className="plan-case__label">{t('PLAN.BEFORE')}</span>
              <EditableText
                value={props.testCase.preconditions}
                placeholder={t('PLAN.BEFORE_PLACEHOLDER')}
                isLocked={props.isLocked}
                onCommit={(preconditions) => {
                  onFieldCommit({ preconditions });
                }}
              />
            </div>
          </div>

          <div className="plan-case__steps">
            <span className="plan-case__step-head">{t('PLAN.COLUMN_NUMBER')}</span>
            <span className="plan-case__step-head">{t('PLAN.COLUMN_ACTION')}</span>
            <span className="plan-case__step-head">{t('PLAN.COLUMN_EXPECTED')}</span>
            <span className="plan-case__step-head" />

            {steps.map((step) => (
              <Fragment key={step.number}>
                <span className="plan-case__step-number">{step.number}</span>
                <EditableText
                  value={step.action}
                  placeholder={t('PLAN.ACTION_PLACEHOLDER')}
                  isLocked={props.isLocked}
                  onCommit={(action) => {
                    onStepCommit({ index: step.number - 1, step: { action } });
                  }}
                />
                <EditableText
                  value={step.expected}
                  placeholder={t('PLAN.EXPECTED_PLACEHOLDER')}
                  isLocked={props.isLocked}
                  onCommit={(expected) => {
                    onStepCommit({ index: step.number - 1, step: { expected } });
                  }}
                />
                {canRemoveStep ? (
                  <button
                    type="button"
                    className="plan-case__remove"
                    aria-label={t('PLAN.REMOVE_STEP', { number: step.number })}
                    onClick={() => {
                      onStepRemove(step.number - 1);
                    }}
                  >
                    ✕
                  </button>
                ) : (
                  <span />
                )}
              </Fragment>
            ))}
          </div>

          {!props.isLocked && (
            <button type="button" className="plan-case__add" onClick={onStepAdd}>
              <span aria-hidden="true">+</span>
              {t('PLAN.ADD_STEP')}
            </button>
          )}
        </div>
      )}
    </Reorder.Item>
  );
};

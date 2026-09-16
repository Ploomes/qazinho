import type { IPlanCaseProps } from './types';
import { Reorder } from 'motion/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusPill } from '@/components/atoms';
import { usePlanCaseViewModel } from './hooks';
import './styles.css';

export const PlanCase: React.FC<IPlanCaseProps> = (props) => {
  const { steps, caret, verdict, onHeadClick } = usePlanCaseViewModel(props);
  const { t } = useTranslation();

  return (
    <Reorder.Item
      value={props.testCase}
      className="plan-case"
      dragListener={!props.isLocked}
      whileDrag={{ scale: 1.012, zIndex: 6 }}
    >
      <button type="button" className="plan-case__head" onClick={onHeadClick}>
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
        <span className="plan-case__title">{props.testCase.title}</span>
        <span className="plan-case__priority">{props.testCase.priority}</span>
        <StatusPill status={verdict} />
      </button>

      {props.isOpen && (
        <div className="plan-case__body">
          <div className="plan-case__meta">
            <div>
              <span className="plan-case__label">{t('PLAN.GOAL')}</span>
              <p className="plan-case__value">{props.testCase.goal}</p>
            </div>
            <div>
              <span className="plan-case__label">{t('PLAN.BEFORE')}</span>
              <p className="plan-case__value">{props.testCase.preconditions}</p>
            </div>
          </div>

          <div className="plan-case__steps">
            <span className="plan-case__step-head">{t('PLAN.COLUMN_NUMBER')}</span>
            <span className="plan-case__step-head">{t('PLAN.COLUMN_ACTION')}</span>
            <span className="plan-case__step-head">{t('PLAN.COLUMN_EXPECTED')}</span>
            <span className="plan-case__step-head">{t('PLAN.COLUMN_LAST_RUN')}</span>

            {steps.map((step) => (
              <Fragment key={step.number}>
                <span className="plan-case__step-number">{step.number}</span>
                <span className="plan-case__step">{step.action}</span>
                <span className="plan-case__step">{step.expected}</span>
                <StatusPill status="pending" />
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </Reorder.Item>
  );
};

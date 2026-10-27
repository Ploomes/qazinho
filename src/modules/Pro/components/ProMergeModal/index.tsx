import { Icon } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { PRO_MERGE_MODAL } from './constants';
import { useProMergeModalViewModel } from './hooks';
import './styles.css';

/**
 * Joins the org's plans with this computer's: each case both changed side by side, the
 * QA keeping one of the two.
 */
export const ProMergeModal: React.FC = () => {
  const view = useProMergeModalViewModel();

  return (
    <ModalFrame
      title={view.title}
      subtitle={view.subtitle}
      width={PRO_MERGE_MODAL.width}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    >
      <div className="pro-merge">
        {view.plans.map((plan) => (
          <section key={plan.key} className="pro-merge__plan">
            <header className="pro-merge__plan-head">
              <Icon name="plan" />
              <h3 className="pro-merge__plan-name">{plan.name}</h3>
              <span className="pro-merge__plan-by">{plan.byline}</span>
            </header>
            {plan.clashes.map((clash) => (
              <div
                key={clash.key}
                className="pro-merge__clash"
                role="radiogroup"
                aria-label={clash.key}
              >
                {clash.sides.map((side) => (
                  <div key={side.key} className={side.className} onClick={side.onKeep}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={side.isChosen}
                      className="pro-merge__pick"
                    >
                      <span className="pro-merge__radio">
                        {side.isChosen && <Icon name="check" />}
                      </span>
                      <span className="pro-merge__label">{side.label}</span>
                    </button>
                    {side.isDeleted ? (
                      <p className="pro-merge__deleted">{side.deleted}</p>
                    ) : (
                      <div className="pro-merge__case">
                        <div className="pro-merge__case-head">
                          <span className="pro-merge__case-id">{side.caseId}</span>
                          <span className="pro-merge__case-title">
                            {side.isTitleChanged ? (
                              <mark className="pro-merge__diff">{side.title}</mark>
                            ) : (
                              side.title
                            )}
                          </span>
                        </div>
                        {side.hasGoal && (
                          <p className="pro-merge__goal">
                            {side.isGoalChanged ? (
                              <mark className="pro-merge__diff">{side.goal}</mark>
                            ) : (
                              side.goal
                            )}
                          </p>
                        )}
                        {side.hasPreconditions && (
                          <div className="pro-merge__fact">
                            <span className="pro-merge__fact-label">
                              {side.preconditionsLabel}
                            </span>
                            <p className="pro-merge__goal">
                              {side.isPreconditionsChanged ? (
                                <mark className="pro-merge__diff">
                                  {side.preconditions}
                                </mark>
                              ) : (
                                side.preconditions
                              )}
                            </p>
                          </div>
                        )}
                        <ol className="pro-merge__steps">
                          {side.steps.map((step) => (
                            <li key={step.key} className="pro-merge__step">
                              <span className="pro-merge__step-number">
                                {step.number}
                              </span>
                              <div className="pro-merge__step-body">
                                <span className="pro-merge__action">
                                  {step.isActionChanged ? (
                                    <mark className="pro-merge__diff">{step.action}</mark>
                                  ) : (
                                    step.action
                                  )}
                                </span>
                                <span className="pro-merge__expected">
                                  <span className="pro-merge__expect-label">
                                    {side.expectLabel}
                                  </span>
                                  <span>
                                    {step.isExpectedChanged ? (
                                      <mark className="pro-merge__diff">
                                        {step.expected}
                                      </mark>
                                    ) : (
                                      step.expected
                                    )}
                                  </span>
                                </span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
    </ModalFrame>
  );
};

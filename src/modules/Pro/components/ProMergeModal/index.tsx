import { Button } from '@/shared/components/atoms';
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
      height={PRO_MERGE_MODAL.height}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    >
      <div className="pro-merge">
        {view.plans.map((plan) => (
          <section key={plan.key} className="pro-merge__plan">
            <h3 className="pro-merge__plan-title">{plan.title}</h3>
            {plan.clashes.map((clash) => (
              <div key={clash.key} className="pro-merge__clash">
                {clash.sides.map((side) => (
                  <div key={side.key} className={side.className}>
                    <span className="pro-merge__label">{side.label}</span>
                    {side.isDeleted ? (
                      <p className="pro-merge__deleted">{side.deleted}</p>
                    ) : (
                      <div className="pro-merge__case">
                        <span className="pro-merge__case-title">
                          {side.isTitleChanged ? (
                            <mark className="pro-merge__mark">{side.title}</mark>
                          ) : (
                            side.title
                          )}
                        </span>
                        <p className="pro-merge__goal">
                          {side.isGoalChanged ? (
                            <mark className="pro-merge__mark">{side.goal}</mark>
                          ) : (
                            side.goal
                          )}
                        </p>
                        {side.hasPreconditions && (
                          <p className="pro-merge__goal">
                            {side.isPreconditionsChanged ? (
                              <mark className="pro-merge__mark">
                                {side.preconditions}
                              </mark>
                            ) : (
                              side.preconditions
                            )}
                          </p>
                        )}
                        <ol className="pro-merge__steps">
                          {side.steps.map((step) => (
                            <li key={step.key} className="pro-merge__step">
                              <span className="pro-merge__action">
                                {step.isActionChanged ? (
                                  <mark className="pro-merge__mark">{step.action}</mark>
                                ) : (
                                  step.action
                                )}
                              </span>
                              <span className="pro-merge__expected">
                                {step.isExpectedChanged ? (
                                  <mark className="pro-merge__mark">{step.expected}</mark>
                                ) : (
                                  step.expected
                                )}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div className="pro-merge__keep">
                      <Button
                        variant={side.isChosen ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={side.onKeep}
                      >
                        {side.keepLabel}
                      </Button>
                    </div>
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

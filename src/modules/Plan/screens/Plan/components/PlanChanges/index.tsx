import type { IPlanChangesProps } from './types';
import { AnimatePresence } from 'motion/react';
import { MeetingModal } from '@/modules/Plan/screens/Plan/components/MeetingModal';
import { TellStoryModal } from '@/modules/Plan/screens/Plan/components/TellStoryModal';
import { Button, Icon, IconButton } from '@/shared/components/atoms';
import { Fold } from '@/shared/components/molecules';
import { usePlanChangesViewModel } from './hooks';
import './styles.css';

/**
 * O que mudou nas fontes do plano depois que ele foi escrito, e as trocas que o agente
 * propôs, cada uma com como está, como fica e o porquê.
 */
export const PlanChanges: React.FC<IPlanChangesProps> = (props) => {
  const {
    canCheck,
    isChecking,
    checkLabel,
    notice,
    closeLabel,
    changedLines,
    canPropose,
    isProposing,
    proposeLabel,
    keepLabel,
    hasReview,
    summary,
    nowLabel,
    thenLabel,
    items,
    canApplyAll,
    applyAllLabel,
    isDone,
    canTell,
    tellLabel,
    doneLabel,
    doneVariant,
    isTelling,
    storyKey,
    note,
    canMeet,
    meetLabel,
    isMeeting,
    onMeet,
    onCancelMeeting,
    onMeeting,
    onCheck,
    onPropose,
    onKeep,
    onApply,
    onRefuse,
    onRefusal,
    onApplyAll,
    onTell,
    onCancelTell,
    onTold,
    onDone,
    onDismissNotice,
  } = usePlanChangesViewModel(props);

  return (
    <>
      {(canCheck || canMeet) && (
        <div className="plan-changes__check">
          {canCheck && (
            <Button variant="ghost" size="sm" disabled={isChecking} onClick={onCheck}>
              <Icon name="reload" />
              {checkLabel}
            </Button>
          )}
          {canMeet && (
            <Button variant="ghost" size="sm" disabled={isProposing} onClick={onMeet}>
              <Icon name="file" />
              {meetLabel}
            </Button>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {notice !== null && (
          <Fold key="notice" className="plan-changes__fold">
            <div className="plan-changes__notice" role="status">
              {notice.url === null ? (
                <span className="plan-changes__notice-text">{notice.text}</span>
              ) : (
                <a
                  className="plan-changes__notice-text plan-changes__notice-link"
                  href={notice.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {notice.text}
                  <Icon name="external" />
                </a>
              )}
              <IconButton
                icon="close"
                size="sm"
                label={closeLabel}
                onClick={onDismissNotice}
              />
            </div>
          </Fold>
        )}

        {changedLines.length > 0 && (
          <Fold key="changed" className="plan-changes__fold">
            <div className="plan-changes__banner" role="status">
              <div className="plan-changes__lines">
                {changedLines.map((line) => (
                  <span key={line} className="plan-changes__line">
                    {line}
                  </span>
                ))}
              </div>
              {canPropose && (
                <div className="plan-changes__actions">
                  <Button size="sm" variant="ghost" onClick={onKeep}>
                    {keepLabel}
                  </Button>
                  <Button size="sm" disabled={isProposing} onClick={onPropose}>
                    <Icon name="sparkle" />
                    {proposeLabel}
                  </Button>
                </div>
              )}
            </div>
          </Fold>
        )}
      </AnimatePresence>

      {hasReview && (
        <section className="plan-changes__review" aria-label={summary}>
          <p className="plan-changes__summary">{summary}</p>

          <ul className="plan-changes__items">
            {items.map((item) => (
              <li key={item.id} className="plan-changes__item">
                <div className="plan-changes__item-head">
                  <span className="plan-changes__item-title">{item.title}</span>
                  {item.state !== '' && (
                    <span className="plan-changes__item-state">{item.state}</span>
                  )}
                </div>
                <p className="plan-changes__item-text">{item.text}</p>

                {item.after.length > 0 && (
                  <div className="plan-changes__compare">
                    {item.before.length > 0 && (
                      <div className="plan-changes__side">
                        <span className="plan-changes__side-label">{nowLabel}</span>
                        {item.before.map((line) => (
                          <span key={line} className="plan-changes__step">
                            {line}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="plan-changes__side">
                      <span className="plan-changes__side-label">{thenLabel}</span>
                      {item.after.map((one) => (
                        <span
                          key={one.line}
                          className={
                            one.isChanged
                              ? 'plan-changes__step plan-changes__step--changed'
                              : 'plan-changes__step'
                          }
                        >
                          {one.line}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.isOpen && (
                  <div className="plan-changes__item-actions">
                    <Button
                      size="sm"
                      onClick={() => {
                        onApply(item.id);
                      }}
                    >
                      {item.applyLabel}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-expanded={item.isRefusing}
                      onClick={() => {
                        onRefuse(item.id);
                      }}
                    >
                      {item.refuseLabel}
                    </Button>
                    {item.isRefusing &&
                      item.refusals.map((refusal) => (
                        <button
                          key={refusal.reason}
                          type="button"
                          className="plan-changes__refusal"
                          onClick={() => {
                            onRefusal({ id: item.id, reason: refusal.reason });
                          }}
                        >
                          {refusal.label}
                        </button>
                      ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="plan-changes__footer">
            {canApplyAll && (
              <Button size="sm" onClick={onApplyAll}>
                {applyAllLabel}
              </Button>
            )}
            {isDone && (
              <>
                {canTell && (
                  <Button size="sm" onClick={onTell}>
                    <Icon name="send" />
                    {tellLabel}
                  </Button>
                )}
                <Button size="sm" variant={doneVariant} onClick={onDone}>
                  {doneLabel}
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      <AnimatePresence>
        {isMeeting && (
          <MeetingModal key="meeting" onCancel={onCancelMeeting} onRead={onMeeting} />
        )}
        {isTelling && (
          <TellStoryModal
            key="tell"
            storyKey={storyKey}
            note={note}
            onCancel={onCancelTell}
            onPosted={onTold}
          />
        )}
      </AnimatePresence>
    </>
  );
};

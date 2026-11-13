import type { IPlanDoubtsProps } from './types';
import { AnimatePresence } from 'motion/react';
import { DoubtsModal } from '@/modules/Plan/screens/Plan/components/DoubtsModal';
import { Button, Icon, IconButton } from '@/shared/components/atoms';
import { Fold, Tooltip } from '@/shared/components/molecules';
import { usePlanDoubtsViewModel } from './hooks';
import './styles.css';

/**
 * As dúvidas do plano que ninguém aqui sabe responder: as que esperam ir à história, as
 * que esperam o time, e o que o time respondeu.
 */
export const PlanDoubts: React.FC<IPlanDoubtsProps> = (props) => {
  const {
    isShown,
    title,
    rows,
    canSend,
    sendLabel,
    canRead,
    isReading,
    readLabel,
    held,
    notice,
    closeLabel,
    isModalOpen,
    storyKey,
    unsent,
    texts,
    onSend,
    onCancelModal,
    onPosted,
    onRead,
    onApply,
    onRemove,
    onDismissNotice,
  } = usePlanDoubtsViewModel(props);

  return (
    <>
      {isShown && (
        <section className="plan-doubts" aria-label={title}>
          <div className="plan-doubts__head">
            <span className="plan-doubts__title">{title}</span>
            <div className="plan-doubts__actions">
              {canRead && (
                <Button variant="ghost" size="sm" disabled={isReading} onClick={onRead}>
                  {readLabel}
                </Button>
              )}
              {canSend && (
                <Button size="sm" onClick={onSend}>
                  <Icon name="send" />
                  {sendLabel}
                </Button>
              )}
            </div>
          </div>

          <ul className="plan-doubts__list">
            {rows.map((row) => (
              <li key={row.id} className="plan-doubts__row">
                <span className="plan-doubts__id">{row.id}</span>
                <div className="plan-doubts__text">
                  <span className="plan-doubts__question">{row.question}</span>
                  {row.answer !== null && (
                    <span className="plan-doubts__answer">{row.answer}</span>
                  )}
                </div>
                <span className="plan-doubts__state">
                  <Icon name={row.icon} />
                  {row.state}
                </span>
                {row.url !== null && (
                  <Tooltip content={row.openLabel}>
                    <a
                      className="plan-doubts__open"
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={row.openLabel}
                    >
                      <Icon name="external" />
                    </a>
                  </Tooltip>
                )}
                {row.canRemove && (
                  <Tooltip content={row.removeLabel}>
                    <IconButton
                      icon="close"
                      size="sm"
                      label={row.removeLabel}
                      onClick={() => {
                        onRemove(row.id);
                      }}
                    />
                  </Tooltip>
                )}
              </li>
            ))}
          </ul>

          <AnimatePresence initial={false}>
            {held !== null && (
              <Fold key="held" className="plan-doubts__fold">
                <div className="plan-doubts__notice">
                  <span className="plan-doubts__notice-text">{held.text}</span>
                  <Button size="sm" disabled={!held.canApply} onClick={onApply}>
                    {held.applyLabel}
                  </Button>
                </div>
              </Fold>
            )}
            {notice !== null && (
              <Fold key="notice" className="plan-doubts__fold">
                <div
                  className={
                    notice.isFailed
                      ? 'plan-doubts__notice plan-doubts__notice--failed'
                      : 'plan-doubts__notice'
                  }
                  role="status"
                >
                  {notice.url === null ? (
                    <span className="plan-doubts__notice-text">{notice.text}</span>
                  ) : (
                    <a
                      className="plan-doubts__notice-text plan-doubts__notice-link"
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
          </AnimatePresence>
        </section>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <DoubtsModal
            key="doubts"
            storyKey={storyKey}
            doubts={unsent}
            texts={texts}
            onCancel={onCancelModal}
            onPosted={onPosted}
          />
        )}
      </AnimatePresence>
    </>
  );
};

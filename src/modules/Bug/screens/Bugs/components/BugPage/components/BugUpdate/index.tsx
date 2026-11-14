import type { IBugUpdateProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useBugUpdateViewModel } from './hooks';
import './styles.css';

/**
 * O que o agente do QA achou de um bug registrado que voltou: a atualização que sugere
 * para a issue, para editar e postar, ou por que não há.
 */
export const BugUpdate: React.FC<IBugUpdateProps> = (props) => {
  const {
    isShown,
    className,
    isWorking,
    icon,
    title,
    reason,
    isEditable,
    commentLabel,
    comment,
    error,
    canPost,
    postLabel,
    dismissLabel,
    isPosted,
    viewLabel,
    isFailed,
    retryLabel,
    isPending,
    pendingLabel,
    onComment,
    onPost,
    onDismiss,
    onRetry,
    onPending,
    onView,
  } = useBugUpdateViewModel(props);

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.section
          key="update"
          className="bug-update__fold"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: MOTION.duration, ease: MOTION.ease }}
        >
          <div className={className}>
            <div className="bug-update__top">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={title}
                  className="bug-update__head"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  {isWorking ? (
                    <span className="bug-update__spinner" aria-hidden="true" />
                  ) : (
                    <Icon name={icon} />
                  )}
                  <span className="bug-update__title">{title}</span>
                </motion.div>
              </AnimatePresence>

              {isPosted && (
                <Button size="sm" onClick={onView}>
                  {viewLabel}
                  <Icon name="external" />
                </Button>
              )}

              {isFailed && (
                <Button size="sm" onClick={onRetry}>
                  {retryLabel}
                </Button>
              )}

              {isPending && (
                <Button size="sm" onClick={onPending}>
                  {pendingLabel}
                </Button>
              )}
            </div>

            {reason !== '' && <p className="bug-update__reason">{reason}</p>}

            {isEditable && (
              <label className="bug-update__field">
                <span className="bug-update__label">{commentLabel}</span>
                <textarea
                  className="bug-update__comment"
                  value={comment}
                  rows={4}
                  onChange={onComment}
                />
              </label>
            )}

            <AnimatePresence initial={false}>
              {error !== '' && (
                <motion.p
                  key="error"
                  className="bug-update__error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {isEditable && (
              <div className="bug-update__actions">
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  {dismissLabel}
                </Button>
                <Button size="sm" variant="primary" disabled={!canPost} onClick={onPost}>
                  <Icon name="send" />
                  {postLabel}
                </Button>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

import type { IBugSendModalProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, IconButton, Input } from '@/shared/components/atoms';
import { SearchList } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { MOTION } from '@/shared/constants';
import { useBugSendModalViewModel } from './hooks';
import './styles.css';

/** Sending a bug to the QA's tracker: Jira or GitHub, the project or repository it goes to, its title, and what goes along with it. */
export const BugSendModal: React.FC<IBugSendModalProps> = (props) => {
  const {
    title,
    subtitle,
    width,
    style,
    isConnected,
    noTracker,
    confirmLabel,
    canConfirm,
    onConfirm,
    onCancel,
    whereLabel,
    hasTrackerChoice,
    trackers,
    picked,
    pickAnotherLabel,
    onClearPicked,
    search,
    onQuery,
    onPick,
    titleLabel,
    titleValue,
    onTitle,
    goesLabel,
    goes,
    githubNote,
  } = useBugSendModalViewModel(props);

  return (
    <ModalFrame
      title={title}
      subtitle={subtitle}
      width={width}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {isConnected ? (
        <div className="bug-send" style={style}>
          <section className="bug-send__part">
            <span className="bug-send__label">{whereLabel}</span>
            {hasTrackerChoice && (
              <div
                className="bug-send__trackers"
                role="radiogroup"
                aria-label={whereLabel}
              >
                {trackers.map((tracker) => (
                  <button
                    key={tracker.id}
                    type="button"
                    role="radio"
                    aria-checked={tracker.isOn}
                    className={tracker.className}
                    onClick={tracker.onClick}
                  >
                    <img className="bug-send__logo" src={tracker.logo} alt="" />
                    {tracker.name}
                  </button>
                ))}
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              {picked !== null ? (
                <motion.span
                  key={picked.id}
                  className="bug-send__picked"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  <img className="bug-send__logo" src={picked.logo} alt="" />
                  <span className="bug-send__picked-label">{picked.label}</span>
                  {picked.detail !== null && (
                    <span className="bug-send__picked-detail">{picked.detail}</span>
                  )}
                  <IconButton
                    icon="close"
                    size="sm"
                    label={pickAnotherLabel}
                    onClick={onClearPicked}
                  />
                </motion.span>
              ) : (
                <motion.div
                  key={search.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                >
                  <SearchList
                    query={search.query}
                    label={search.label}
                    placeholder={search.placeholder}
                    items={search.items}
                    note={search.note}
                    emptyText={search.emptyText}
                    isAutoFocused={search.isAutoFocused}
                    onQuery={onQuery}
                    onPick={onPick}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <label className="bug-send__part">
            <span className="bug-send__label">{titleLabel}</span>
            <Input value={titleValue} label={titleLabel} onChange={onTitle} />
          </label>

          <section className="bug-send__part">
            <span className="bug-send__label">{goesLabel}</span>
            <ul className="bug-send__goes">
              <AnimatePresence initial={false}>
                {goes.map((line) => (
                  <motion.li
                    key={line.key}
                    className="bug-send__goes-line"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                  >
                    <span className="bug-send__goes-body">
                      <Icon name={line.icon} />
                      {line.text}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <AnimatePresence initial={false}>
              {githubNote !== null && (
                <motion.div
                  key="github"
                  className="bug-send__fold"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                >
                  <p className="bug-send__note">{githubNote}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      ) : (
        <p className="bug-send__empty">{noTracker}</p>
      )}
    </ModalFrame>
  );
};

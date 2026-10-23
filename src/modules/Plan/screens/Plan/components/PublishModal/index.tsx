import type { IPublishModalProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { IconButton, Input } from '@/shared/components/atoms';
import { SearchList } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { MOTION } from '@/shared/constants';
import { usePublishModalViewModel } from './hooks';
import './styles.css';

/** Publishing a plan in Confluence the first time: the space, the page it goes under if any, and its title. */
export const PublishModal: React.FC<IPublishModalProps> = (props) => {
  const {
    title,
    subtitle,
    width,
    confirmLabel,
    canConfirm,
    spaceLabel,
    space,
    spaceSearch,
    parentLabel,
    parentNote,
    hasParentSearch,
    parent,
    parentSearch,
    pickAnotherLabel,
    titleLabel,
    titleValue,
    onSpaceQuery,
    onPickSpace,
    onClearSpace,
    onParentQuery,
    onPickParent,
    onClearParent,
    onTitle,
    onCancel,
    onConfirm,
  } = usePublishModalViewModel(props);

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
      <div className="publish-modal">
        <section className="publish-modal__part">
          <span className="publish-modal__label">{spaceLabel}</span>
          <AnimatePresence mode="wait" initial={false}>
            {space !== null ? (
              <motion.span
                key={space.id}
                className="publish-modal__picked"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                <span className="publish-modal__picked-label">{space.label}</span>
                <span className="publish-modal__picked-detail">{space.detail}</span>
                <IconButton
                  icon="close"
                  size="sm"
                  label={pickAnotherLabel}
                  onClick={onClearSpace}
                />
              </motion.span>
            ) : (
              <motion.div
                key="spaces"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                <SearchList
                  query={spaceSearch.query}
                  label={spaceSearch.label}
                  placeholder={spaceSearch.placeholder}
                  items={spaceSearch.items}
                  note={spaceSearch.note}
                  emptyText={spaceSearch.emptyText}
                  isAutoFocused
                  onQuery={onSpaceQuery}
                  onPick={onPickSpace}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <AnimatePresence initial={false}>
          {hasParentSearch && (
            <motion.section
              key="parent"
              className="publish-modal__fold"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <div className="publish-modal__part">
                <span className="publish-modal__label">{parentLabel}</span>
                <p className="publish-modal__note">{parentNote}</p>
                <AnimatePresence mode="wait" initial={false}>
                  {parent !== null ? (
                    <motion.span
                      key={parent.id}
                      className="publish-modal__picked"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                    >
                      <span className="publish-modal__picked-label">{parent.label}</span>
                      <IconButton
                        icon="close"
                        size="sm"
                        label={pickAnotherLabel}
                        onClick={onClearParent}
                      />
                    </motion.span>
                  ) : (
                    <motion.div
                      key="pages"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                    >
                      <SearchList
                        query={parentSearch.query}
                        label={parentSearch.label}
                        placeholder={parentSearch.placeholder}
                        items={parentSearch.items}
                        note={parentSearch.note}
                        emptyText={parentSearch.emptyText}
                        onQuery={onParentQuery}
                        onPick={onPickParent}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <label className="publish-modal__part">
          <span className="publish-modal__label">{titleLabel}</span>
          <Input value={titleValue} label={titleLabel} onChange={onTitle} />
        </label>
      </div>
    </ModalFrame>
  );
};

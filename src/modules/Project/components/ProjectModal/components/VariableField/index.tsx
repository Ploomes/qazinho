import type { IVariableFieldProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TargetCard } from '@/modules/Project/components/ProjectModal/components/TargetCard';
import { LOCK_ICON } from '@/modules/Project/constants';
import { Button, IconButton } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { VariableEditor } from './components';
import { useVariableFieldViewModel } from './hooks';
import './styles.css';

/** The project's logins and secrets: each by its name and what it holds, its value sealed and never shown, edited in place and saved with the project. */
export const VariableField: React.FC<IVariableFieldProps> = (props) => {
  const {
    rows,
    isAdding,
    canAdd,
    isEmpty,
    emptyText,
    sealedLabel,
    addLabel,
    doneLabel,
    cancelLabel,
    editor,
    onAdd,
    onEdit,
    onRemove,
    onDone,
    onCancelEdit,
  } = useVariableFieldViewModel(props);
  const { t } = useTranslation();

  return (
    <TargetCard
      name={t('PROJECT.VARIABLES_NAME')}
      text={t('PROJECT.VARIABLES_TEXT')}
      lock={null}
      isStacked
    >
      <div className="variable-field">
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.div
              key={row.key}
              className="variable-field__fold"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {row.isEditing && editor !== null ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                  >
                    <VariableEditor
                      name={editor.name}
                      description={editor.description}
                      value={editor.value}
                      valuePlaceholder={editor.valuePlaceholder}
                      problem={editor.problem}
                      canFinish={editor.canFinish}
                      doneLabel={doneLabel}
                      cancelLabel={cancelLabel}
                      onName={editor.onName}
                      onDescription={editor.onDescription}
                      onValue={editor.onValue}
                      onDone={onDone}
                      onCancel={onCancelEdit}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="row"
                    className="variable-field__row"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                  >
                    <span className="variable-field__name">{row.name}</span>
                    {row.tag !== '' && (
                      <span className="variable-field__tag">{row.tag}</span>
                    )}
                    <span className="variable-field__description">{row.description}</span>
                    <span className="variable-field__sealed" title={sealedLabel}>
                      <svg
                        className="variable-field__lock"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {LOCK_ICON.map((path) => (
                          <path key={path} d={path} />
                        ))}
                      </svg>
                      <span aria-label={sealedLabel}>••••••</span>
                    </span>
                    <IconButton
                      glyph="✎"
                      size="sm"
                      label={row.editLabel}
                      onClick={() => {
                        onEdit(row.key);
                      }}
                    />
                    <IconButton
                      glyph="✕"
                      size="sm"
                      label={row.removeLabel}
                      onClick={() => {
                        onRemove(row.key);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {isAdding && editor !== null && (
            <motion.div
              key="adding"
              className="variable-field__fold"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <VariableEditor
                name={editor.name}
                description={editor.description}
                value={editor.value}
                valuePlaceholder={editor.valuePlaceholder}
                problem={editor.problem}
                canFinish={editor.canFinish}
                doneLabel={doneLabel}
                cancelLabel={cancelLabel}
                onName={editor.onName}
                onDescription={editor.onDescription}
                onValue={editor.onValue}
                onDone={onDone}
                onCancel={onCancelEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isEmpty && <p className="variable-field__empty">{emptyText}</p>}

        {canAdd && (
          <div className="variable-field__add">
            <Button size="sm" variant="ghost" onClick={onAdd}>
              <span aria-hidden="true">+</span> {addLabel}
            </Button>
          </div>
        )}
      </div>
    </TargetCard>
  );
};

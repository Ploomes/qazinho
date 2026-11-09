import type { IVariableFieldProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TargetCard } from '@/modules/Project/components/ProjectModal/components/TargetCard';
import { Button, Icon, IconButton } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { VariableEditor } from './components';
import { useVariableFieldViewModel } from './hooks';
import './styles.css';

/**
 * Os logins e segredos do projeto: cada um pelo nome e pelo que guarda, um segredo nunca
 * mostrado, o resto quando o QA pede, editado no lugar e salvo com o projeto.
 */
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
    onReveal,
    onRemove,
    onDone,
    onCancelEdit,
  } = useVariableFieldViewModel(props);
  const { t } = useTranslation();

  return (
    <TargetCard name={t('PROJECT.VARIABLES_NAME')} lock={null} isStacked>
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
                      isSecret={editor.isSecret}
                      problem={editor.problem}
                      canFinish={editor.canFinish}
                      doneLabel={doneLabel}
                      cancelLabel={cancelLabel}
                      onName={editor.onName}
                      onDescription={editor.onDescription}
                      onValue={editor.onValue}
                      onSecret={editor.onSecret}
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
                    <span className="variable-field__about">
                      <span className="variable-field__title">
                        <span className="variable-field__name">{row.name}</span>
                        {row.tag !== '' && (
                          <span className="variable-field__tag">{row.tag}</span>
                        )}
                      </span>
                      {row.description !== '' && (
                        <span
                          className="variable-field__description"
                          title={row.description}
                        >
                          {row.description}
                        </span>
                      )}
                    </span>
                    {row.isSecret ? (
                      <span className="variable-field__sealed" title={sealedLabel}>
                        <span className="variable-field__lock">
                          <Icon name="lock" size={12} />
                        </span>
                        <span aria-label={sealedLabel}>••••••</span>
                      </span>
                    ) : (
                      <>
                        <span className="variable-field__plain">
                          {row.shownValue ?? '••••••'}
                        </span>
                        <IconButton
                          icon={row.revealIcon}
                          size="sm"
                          label={row.revealLabel}
                          onClick={() => {
                            onReveal(row.key);
                          }}
                        />
                      </>
                    )}
                    <IconButton
                      icon="edit"
                      size="sm"
                      label={row.editLabel}
                      onClick={() => {
                        onEdit(row.key);
                      }}
                    />
                    <IconButton
                      icon="close"
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
                isSecret={editor.isSecret}
                problem={editor.problem}
                canFinish={editor.canFinish}
                doneLabel={doneLabel}
                cancelLabel={cancelLabel}
                onName={editor.onName}
                onDescription={editor.onDescription}
                onValue={editor.onValue}
                onSecret={editor.onSecret}
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
              <Icon name="plus" /> {addLabel}
            </Button>
          </div>
        )}
      </div>
    </TargetCard>
  );
};

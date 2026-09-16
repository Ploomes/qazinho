import { useTranslation } from 'react-i18next';
import { Eyebrow, Input } from '@/components/atoms';
import { ModalFrame } from '@/components/templates';
import { useNewWorkspaceModalViewModel } from './hooks';
import './styles.css';

export const NewWorkspaceModal: React.FC = () => {
  const {
    name,
    targets,
    chosenTargetId,
    projectName,
    canCreate,
    onNameChange,
    onTargetChange,
    onCancel,
    onCreate,
  } = useNewWorkspaceModalViewModel();
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={t('NEW_WORKSPACE.TITLE')}
      subtitle={t('NEW_WORKSPACE.SUBTITLE', { project: projectName })}
      width={520}
      confirmLabel={t('NEW_WORKSPACE.CREATE')}
      canConfirm={canCreate}
      hint={t('NEW_WORKSPACE.HINT')}
      onCancel={onCancel}
      onConfirm={onCreate}
    >
      <div>
        <Eyebrow>{t('NEW_WORKSPACE.NAME')}</Eyebrow>
        <Input
          value={name}
          label={t('NEW_WORKSPACE.NAME')}
          placeholder={t('NEW_WORKSPACE.NAME_PLACEHOLDER')}
          onChange={onNameChange}
        />
      </div>

      <div>
        <Eyebrow>{t('NEW_WORKSPACE.TARGET')}</Eyebrow>
        <div className="new-workspace__targets">
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              className={
                target.id === chosenTargetId
                  ? 'new-workspace__target new-workspace__target--chosen'
                  : 'new-workspace__target'
              }
              onClick={() => {
                onTargetChange(target.id);
              }}
            >
              {target.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Eyebrow>{t('NEW_WORKSPACE.ISSUE')}</Eyebrow>
        <p className="new-workspace__issue">{t('NEW_WORKSPACE.ISSUE_EMPTY')}</p>
      </div>
    </ModalFrame>
  );
};

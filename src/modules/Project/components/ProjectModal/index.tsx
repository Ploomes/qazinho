import { useTranslation } from 'react-i18next';
import { ProjectProPane } from '@/modules/Pro/components/ProjectProPane';
import { Button, Eyebrow, Input, Switch } from '@/shared/components/atoms';
import { FileField } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import {
  BuildFromCode,
  ProjectNav,
  ProjectPane,
  RepoField,
  TargetCard,
  VariableField,
} from './components';
import { PROJECT_MODAL } from './constants';
import { useProjectModalViewModel } from './hooks';
import './styles.css';

/**
 * A janela de um projeto, em seções ao lado: o nome e os alvos, o código de que é feito,
 * as variáveis, o vínculo com o QAzinho Pro, e apagá-lo.
 */
export const ProjectModal: React.FC = () => {
  const {
    name,
    url,
    apk,
    app,
    repositories,
    variables,
    savedVariables,
    projectId,
    androidBuilder,
    iosBuilder,
    isEditing,
    section,
    navItems,
    isOpen,
    title,
    confirmLabel,
    canConfirm,
    deleteTitle,
    deleteText,
    losses,
    hasLosses,
    androidLock,
    iosLock,
    footerHint,
    isConfirmQuiet,
    onNameChange,
    onRepositoriesChange,
    onVariablesChange,
    onUrlChange,
    onPickApk,
    onPickApp,
    onCancel,
    onConfirm,
    onSelectSection,
    hasDeleteInOrg,
    deleteInOrgLabel,
    isDeleteInOrgOn,
    onDeleteInOrgChange,
    hasDeleteOrgNote,
    deleteOrgNote,
    hasDeleteFailure,
    deleteFailure,
    canDelete,
    onDelete,
  } = useProjectModalViewModel();
  const { t } = useTranslation();

  return (
    <ModalFrame
      title={title}
      width={PROJECT_MODAL.width}
      height={PROJECT_MODAL.height}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      hint={footerHint}
      isConfirmQuiet={isConfirmQuiet}
      nav={
        <ProjectNav
          label={t('PROJECT.SECTIONS')}
          items={navItems}
          current={section}
          flagWord={t('PROJECT.SECTION_FLAGGED')}
          onSelect={onSelectSection}
        />
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="project-modal__panes">
        <ProjectPane label={t('PROJECT.SECTION_GENERAL')} isOpen={isOpen.general}>
          <div className="project-modal__group">
            <Eyebrow>{t('PROJECT.NAME')}</Eyebrow>
            <Input
              value={name}
              label={t('PROJECT.NAME')}
              placeholder={t('PROJECT.NAME_PLACEHOLDER')}
              onChange={onNameChange}
            />
          </div>

          <div className="project-modal__group">
            <Eyebrow>{t('PROJECT.TARGETS')}</Eyebrow>
            <div className="project-modal__targets">
              <TargetCard platform="web" name={t('PROJECT.WEB')} lock={null}>
                <Input
                  isMono
                  isCompact
                  value={url}
                  label={t('PROJECT.WEB')}
                  placeholder={t('PROJECT.WEB_PLACEHOLDER')}
                  onChange={onUrlChange}
                />
              </TargetCard>

              <TargetCard
                platform="android"
                name={t('PROJECT.ANDROID')}
                lock={androidLock}
              >
                <FileField
                  value={apk}
                  label={t('PROJECT.ANDROID')}
                  placeholder={t('PROJECT.ANDROID_PLACEHOLDER')}
                  onPick={onPickApk}
                />
                {androidBuilder.isShown && (
                  <BuildFromCode
                    platform="android"
                    projectId={projectId}
                    repositories={repositories}
                    buildId={androidBuilder.buildId}
                    onStart={androidBuilder.onStart}
                    onReset={androidBuilder.onReset}
                  />
                )}
              </TargetCard>

              <TargetCard platform="ios" name={t('PROJECT.IOS')} lock={iosLock}>
                <FileField
                  value={app}
                  label={t('PROJECT.IOS')}
                  placeholder={t('PROJECT.IOS_PLACEHOLDER')}
                  onPick={onPickApp}
                />
                {iosBuilder.isShown && (
                  <BuildFromCode
                    platform="ios"
                    projectId={projectId}
                    repositories={repositories}
                    buildId={iosBuilder.buildId}
                    onStart={iosBuilder.onStart}
                    onReset={iosBuilder.onReset}
                  />
                )}
              </TargetCard>
            </div>
          </div>
        </ProjectPane>

        <ProjectPane label={t('PROJECT.SECTION_CODE')} isOpen={isOpen.code}>
          <RepoField repositories={repositories} onChange={onRepositoriesChange} />
        </ProjectPane>

        <ProjectPane label={t('PROJECT.SECTION_VARIABLES')} isOpen={isOpen.variables}>
          <VariableField
            variables={variables}
            saved={savedVariables}
            onChange={onVariablesChange}
          />
        </ProjectPane>

        {isEditing && projectId !== null && (
          <ProjectPane label={t('PROJECT.SECTION_PRO')} isOpen={isOpen.pro}>
            <ProjectProPane projectId={projectId} />
          </ProjectPane>
        )}

        {isEditing && (
          <ProjectPane label={t('PROJECT.DELETE')} isOpen={isOpen.delete}>
            <div className="project-modal__danger">
              <span className="project-modal__danger-title">{deleteTitle}</span>
              <p className="project-modal__danger-text">{deleteText}</p>
              {hasLosses && (
                <ul className="project-modal__losses">
                  {losses.map((loss) => (
                    <li key={loss} className="project-modal__loss">
                      {loss}
                    </li>
                  ))}
                </ul>
              )}
              {hasDeleteInOrg && (
                <Switch
                  label={deleteInOrgLabel}
                  isOn={isDeleteInOrgOn}
                  onChange={onDeleteInOrgChange}
                />
              )}
              {hasDeleteOrgNote && (
                <p className="project-modal__danger-text">{deleteOrgNote}</p>
              )}
              <p className="project-modal__danger-text">{t('PROJECT.DELETE_UNDO')}</p>
              {hasDeleteFailure && (
                <p className="project-modal__danger-failure" role="alert">
                  {deleteFailure}
                </p>
              )}
              <div className="project-modal__danger-actions">
                <Button variant="danger" disabled={!canDelete} onClick={onDelete}>
                  {t('PROJECT.DELETE')}
                </Button>
              </div>
            </div>
          </ProjectPane>
        )}
      </div>
    </ModalFrame>
  );
};

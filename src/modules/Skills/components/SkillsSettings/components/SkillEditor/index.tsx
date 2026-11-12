import type { ISkillEditorProps } from './types';
import { Button, Input, Switch } from '@/shared/components/atoms';
import { SegmentedControl } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { useSkillEditorViewModel } from './hooks';
import './styles.css';

/**
 * Uma skill aberta para ler ou mudar: o nome, quando usar, onde vale, em quais projetos e
 * as instruções; uma que veio de fora só muda onde vale.
 */
export const SkillEditor: React.FC<ISkillEditorProps> = (props) => {
  const view = useSkillEditorViewModel(props);

  return (
    <ModalFrame
      title={view.title}
      width={view.width}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canSave}
      onCancel={view.onCancel}
      onConfirm={() => {
        void view.onConfirm();
      }}
      aside={
        <div className="skill-editor__aside">
          {view.canDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void view.onDelete();
              }}
            >
              {view.deleteLabel}
            </Button>
          )}
          {view.canExport && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void view.onExport();
              }}
            >
              {view.exportLabel}
            </Button>
          )}
          {view.canDuplicate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void view.onDuplicate();
              }}
            >
              {view.duplicateLabel}
            </Button>
          )}
        </div>
      }
    >
      <div className="skill-editor">
        {view.note !== '' && <p className="skill-editor__note">{view.note}</p>}

        {view.isOwn && (
          <>
            <Input
              label={view.nameLabel}
              placeholder={view.namePlaceholder}
              value={view.name}
              isMono
              onChange={view.onName}
            />
            <Input
              label={view.descriptionLabel}
              placeholder={view.descriptionPlaceholder}
              value={view.description}
              onChange={view.onDescription}
            />
          </>
        )}

        <div className="skill-editor__part">
          <span className="skill-editor__label">{view.useLabel}</span>
          <SegmentedControl
            label={view.useLabel}
            options={view.uses}
            value={view.use}
            onChange={view.onUse}
          />
        </div>

        <div className="skill-editor__part">
          <span className="skill-editor__label">{view.projectsLabel}</span>
          <SegmentedControl
            label={view.projectsLabel}
            options={view.reaches}
            value={view.reach}
            onChange={view.onReach}
          />
          {view.isPicking && (
            <div className="skill-editor__projects">
              {view.projects.map((project) => (
                <Switch
                  key={project.id}
                  label={project.name}
                  isOn={project.isOn}
                  onChange={project.onChange}
                />
              ))}
            </div>
          )}
        </div>

        <label className="skill-editor__part">
          <span className="skill-editor__label">{view.bodyLabel}</span>
          <textarea
            className="skill-editor__body"
            value={view.body}
            placeholder={view.bodyPlaceholder}
            rows={12}
            readOnly={!view.isOwn}
            onChange={view.onBody}
          />
        </label>

        {view.filesLabel !== '' && (
          <p className="skill-editor__note">{view.filesLabel}</p>
        )}
        {view.exported !== '' && <p className="skill-editor__note">{view.exported}</p>}
        {view.error !== '' && <p className="skill-editor__error">{view.error}</p>}
      </div>
    </ModalFrame>
  );
};

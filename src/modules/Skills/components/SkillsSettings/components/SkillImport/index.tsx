import type { ISkillImportProps } from './types';
import { Button, Input, Switch } from '@/shared/components/atoms';
import { SearchList, SegmentedControl } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { useSkillImportViewModel } from './hooks';
import './styles.css';

/**
 * Traz skills para o QAzinho: de uma pasta do repositório do time numa branch, das pastas
 * deste computador, ou de um arquivo; todas chegam desligadas.
 */
export const SkillImport: React.FC<ISkillImportProps> = (props) => {
  const view = useSkillImportViewModel(props);

  return (
    <ModalFrame
      title={view.title}
      width={view.width}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      onCancel={view.onCancel}
      onConfirm={() => {
        void view.onConfirm();
      }}
    >
      <div className="skill-import">
        <SegmentedControl
          label={view.title}
          options={view.froms}
          value={view.from}
          onChange={view.onFrom}
        />

        {view.isRepo && view.githubNote !== '' && (
          <p className="skill-import__note">{view.githubNote}</p>
        )}

        {view.isRepo && view.githubNote === '' && (
          <div className="skill-import__part">
            {view.picked === null ? (
              <SearchList
                {...view.search}
                onQuery={view.onQuery}
                onPick={view.onPickRepository}
              />
            ) : (
              <>
                <button
                  type="button"
                  className="skill-import__picked"
                  onClick={() => {
                    view.onPickRepository('');
                  }}
                >
                  {view.picked}
                </button>
                <div className="skill-import__row">
                  <label className="skill-import__field">
                    <span className="skill-import__label">{view.branchLabel}</span>
                    <Input
                      label={view.branchLabel}
                      value={view.branch}
                      isMono
                      onChange={view.onBranch}
                    />
                  </label>
                  <label className="skill-import__field">
                    <span className="skill-import__label">{view.folderLabel}</span>
                    <Input
                      label={view.folderLabel}
                      value={view.folder}
                      isMono
                      onChange={view.onFolder}
                    />
                  </label>
                </div>
                <Button
                  size="sm"
                  disabled={!view.canLook}
                  onClick={() => {
                    void view.onLook();
                  }}
                >
                  {view.lookLabel}
                </Button>
              </>
            )}
            {view.foundNote !== '' && (
              <p className="skill-import__note">{view.foundNote}</p>
            )}
          </div>
        )}

        {view.hereNote !== '' && <p className="skill-import__note">{view.hereNote}</p>}

        {view.isFile ? (
          <div className="skill-import__part">
            <p className="skill-import__note">{view.fileNote}</p>
            <Button
              size="sm"
              onClick={() => {
                void view.onPickFile();
              }}
            >
              {view.pickFileLabel}
            </Button>
          </div>
        ) : (
          view.skills.length > 0 && (
            <ul className="skill-import__list">
              {view.skills.map((skill) => (
                <li key={skill.key} className="skill-import__skill">
                  <span className="skill-import__text">
                    <span className="skill-import__name">{skill.name}</span>
                    <span className="skill-import__description">{skill.description}</span>
                    {skill.isKept && (
                      <span className="skill-import__kept">{view.keptLabel}</span>
                    )}
                  </span>
                  <Switch
                    label={skill.name}
                    isOn={skill.isOn}
                    isLabelHidden
                    onChange={skill.onChange}
                  />
                </li>
              ))}
            </ul>
          )
        )}

        <p className="skill-import__note">{view.note}</p>
      </div>
    </ModalFrame>
  );
};

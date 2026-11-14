import type { ITemplateEditorProps } from './types';
import { ReportPreview } from '@/modules/Template/components/ReportPreview';
import { Button, Icon, IconButton, Input, Switch } from '@/shared/components/atoms';
import { SegmentedControl, Tooltip } from '@/shared/components/molecules';
import { ModalFrame } from '@/shared/components/templates';
import { useTemplateEditorViewModel } from './hooks';
import './styles.css';

/**
 * Um modelo do time aberto: o nome, as partes na ordem que o time quer, cada seção com o
 * título dela e cada texto com os campos, e a prévia do que ele monta.
 */
export const TemplateEditor: React.FC<ITemplateEditorProps> = (props) => {
  const view = useTemplateEditorViewModel(props);

  return (
    <ModalFrame
      title={view.title}
      width={view.width}
      confirmLabel={view.confirmLabel}
      canConfirm={view.canConfirm}
      hint={view.hint}
      aside={
        view.canDelete && (
          <Button variant="ghost" onClick={view.onDelete}>
            {view.deleteLabel}
          </Button>
        )
      }
      onCancel={view.onCancel}
      onConfirm={view.onConfirm}
    >
      <div className="template-editor">
        <div className="template-editor__form">
          {view.hasPlaces && (
            <SegmentedControl
              label={view.placeLabel}
              options={view.places}
              value={view.place}
              onChange={view.onPlace}
            />
          )}
          {view.isNew && (
            <SegmentedControl
              label={view.kindLabel}
              options={view.kinds}
              value={view.kind}
              onChange={view.onKind}
            />
          )}
          <label className="template-editor__field">
            <span className="template-editor__label">{view.nameLabel}</span>
            <Input
              value={view.name}
              label={view.nameLabel}
              placeholder={view.namePlaceholder}
              onChange={view.onName}
            />
          </label>
          {view.hasTitle && (
            <label className="template-editor__field">
              <span className="template-editor__label">{view.titleLabel}</span>
              <Input
                isMono
                value={view.titleValue}
                label={view.titleLabel}
                placeholder="{{title}}"
                onChange={view.onTitle}
              />
              <span className="template-editor__note">{view.titleNote}</span>
            </label>
          )}
          {view.hasCases && (
            <SegmentedControl
              label={view.casesLabel}
              options={view.casesOptions}
              value={view.cases}
              onChange={view.onCases}
            />
          )}

          {view.hasDefault && (
            <Switch
              label={view.defaultLabel}
              isOn={view.isDefault}
              onChange={view.onDefault}
            />
          )}

          <div className="template-editor__parts">
            <span className="template-editor__label">{view.partsLabel}</span>
            {view.parts.map((part) => (
              <div key={part.key} className="template-editor__part">
                <span className="template-editor__part-label">{part.label}</span>
                <div className="template-editor__part-row">
                  {part.isSection ? (
                    <Input
                      isCompact
                      value={part.value}
                      label={part.label}
                      onChange={(value) => {
                        view.onValue({ index: part.index, value });
                      }}
                    />
                  ) : (
                    <textarea
                      className="template-editor__text"
                      value={part.value}
                      aria-label={part.label}
                      onChange={(event) => {
                        view.onValue({ index: part.index, value: event.target.value });
                      }}
                    />
                  )}
                  {part.canUp && (
                    <Tooltip content={view.moveUpLabel}>
                      <IconButton
                        icon="caretUp"
                        size="sm"
                        label={view.moveUpLabel}
                        onClick={() => {
                          view.onMove({ index: part.index, by: -1 });
                        }}
                      />
                    </Tooltip>
                  )}
                  {part.canDown && (
                    <Tooltip content={view.moveDownLabel}>
                      <IconButton
                        icon="caretDown"
                        size="sm"
                        label={view.moveDownLabel}
                        onClick={() => {
                          view.onMove({ index: part.index, by: 1 });
                        }}
                      />
                    </Tooltip>
                  )}
                  <Tooltip content={view.removeLabel}>
                    <IconButton
                      icon="close"
                      size="sm"
                      label={view.removeLabel}
                      onClick={() => {
                        view.onRemove(part.index);
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
            <span className="template-editor__note">{view.textNote}</span>
            <div className="template-editor__adds">
              <button
                type="button"
                className="template-editor__add"
                onClick={view.onAddText}
              >
                <Icon name="plus" />
                {view.addTextLabel}
              </button>
              {view.addable.map((one) => (
                <button
                  key={one.field}
                  type="button"
                  className="template-editor__add"
                  onClick={() => {
                    view.onAddSection(one.field);
                  }}
                >
                  <Icon name="plus" />
                  {one.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="template-editor__preview">
          <span className="template-editor__label">{view.previewLabel}</span>
          {view.previewTitle !== '' && (
            <span className="template-editor__preview-title">{view.previewTitle}</span>
          )}
          <ReportPreview blocks={view.preview} label={view.previewLabel} />
        </div>
      </div>
    </ModalFrame>
  );
};

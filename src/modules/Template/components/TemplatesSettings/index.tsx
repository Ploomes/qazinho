import { AnimatePresence } from 'motion/react';
import { TemplateEditor } from '@/modules/Template/components/TemplateEditor';
import { Button, Icon } from '@/shared/components/atoms';
import { useTemplatesSettingsViewModel } from './hooks';
import './styles.css';

/** Os modelos do time em Configurações, por tipo, e a porta para criar e editar um. */
export const TemplatesSettings: React.FC = () => {
  const view = useTemplatesSettingsViewModel();

  return (
    <div className="templates-settings">
      <div className="templates-settings__top">
        <p className="templates-settings__note">{view.note}</p>
        <Button size="sm" variant="primary" onClick={view.onNew}>
          <Icon name="plus" />
          {view.newLabel}
        </Button>
      </div>

      {view.sections.map((section) => (
        <section key={section.kind} className="templates-settings__section">
          <h2 className="templates-settings__heading">{section.title}</h2>
          {section.rows.length === 0 ? (
            <p className="templates-settings__none">{view.noneText}</p>
          ) : (
            <ul className="templates-settings__list">
              {section.rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="templates-settings__row"
                    onClick={row.onOpen}
                  >
                    <span className="templates-settings__name">{row.name}</span>
                    <span className="templates-settings__facts">{row.facts}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <AnimatePresence>
        {view.isEditing && (
          <TemplateEditor
            key={view.editorKey}
            editing={view.editing}
            onClose={view.onClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

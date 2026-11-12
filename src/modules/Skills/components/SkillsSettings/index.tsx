import { AnimatePresence } from 'motion/react';
import { Button, EmptyState, Icon, Switch } from '@/shared/components/atoms';
import { SkillCreator, SkillEditor, SkillImport } from './components';
import { useSkillsSettingsViewModel } from './hooks';
import './styles.css';

/**
 * As skills do time em Configurações: as ligadas e as desligadas, cada uma com onde vale
 * e de onde veio, e as portas para criar, escrever e importar uma.
 */
export const SkillsSettings: React.FC = () => {
  const view = useSkillsSettingsViewModel();

  return (
    <div className="skills-settings">
      <div className="skills-settings__top">
        <p className="skills-settings__note">{view.note}</p>
        <div className="skills-settings__actions">
          <Button size="sm" onClick={view.onImport}>
            {view.importLabel}
          </Button>
          <Button size="sm" variant="primary" onClick={view.onNew}>
            <Icon name="plus" />
            {view.newLabel}
          </Button>
        </div>
      </div>

      {view.isEmpty && <EmptyState title={view.emptyTitle} body={view.emptyText} />}

      {view.sections.map((section) => (
        <section key={section.key} className="skills-settings__section">
          <h2 className="skills-settings__heading">{section.title}</h2>
          <ul className="skills-settings__list">
            {section.rows.map((row) => (
              <li key={row.id} className="skills-settings__row">
                <button
                  type="button"
                  className="skills-settings__open"
                  aria-label={row.editLabel}
                  onClick={row.onOpen}
                >
                  <span className="skills-settings__name">{row.name}</span>
                  <span className="skills-settings__description">{row.description}</span>
                  <span className="skills-settings__facts">
                    <span>{row.facts}</span>
                    <span>{row.source}</span>
                  </span>
                </button>
                <Switch
                  label={row.toggleLabel}
                  isOn={row.isOn}
                  isLabelHidden
                  onChange={row.onToggle}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <AnimatePresence>
        {view.editing !== null && (
          <SkillEditor
            key="editor"
            editing={view.editing}
            projects={view.projects}
            onClose={view.onCloseEditor}
          />
        )}
        {view.isCreating && (
          <SkillCreator
            key="creator"
            onClose={view.onCloseCreator}
            onWrite={view.onWrite}
            onDrafted={view.onDrafted}
          />
        )}
        {view.isImporting && <SkillImport key="import" onClose={view.onCloseImport} />}
      </AnimatePresence>
    </div>
  );
};

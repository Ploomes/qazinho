import type { IImportFieldProps } from './types';
import { useTranslation } from 'react-i18next';
import { TargetCard } from '@/modules/Project/components/ProjectModal/components/TargetCard';
import { Button, Icon } from '@/shared/components/atoms';
import { useImportFieldViewModel } from './hooks';
import './styles.css';

/**
 * Importar os testes que o QA já tem ao criar o projeto: a pasta que ele escolhe vira um
 * plano no chat do primeiro workspace.
 */
export const ImportField: React.FC<IImportFieldProps> = (props) => {
  const {
    hasFolder,
    isPicking,
    name,
    kinds,
    branch,
    path,
    pickLabel,
    changeLabel,
    removeLabel,
    failureText,
    onPick,
    onRemove,
  } = useImportFieldViewModel(props);
  const { t } = useTranslation();

  return (
    <TargetCard name={t('PROJECT.IMPORT_TITLE')} lock={null} isStacked>
      <div className="import-field">
        {hasFolder ? (
          <>
            <div className="import-field__head">
              <span className="import-field__icon">
                <Icon name="folder" />
              </span>
              <span className="import-field__name">{name}</span>
              <span className="import-field__chip">{kinds}</span>
              {branch !== null && (
                <span className="import-field__chip">
                  <Icon name="branch" /> {branch}
                </span>
              )}
            </div>
            <span className="import-field__path" title={path}>
              {path}
            </span>
            <div className="import-field__actions">
              <Button size="sm" disabled={isPicking} onClick={onPick}>
                <Icon name="folder" /> {changeLabel}
              </Button>
              <Button size="sm" variant="danger-quiet" onClick={onRemove}>
                {removeLabel}
              </Button>
            </div>
          </>
        ) : (
          <Button size="sm" variant="primary" disabled={isPicking} onClick={onPick}>
            <Icon name="folder" /> {pickLabel}
          </Button>
        )}
        {failureText !== null && <p className="import-field__note">{failureText}</p>}
      </div>
    </TargetCard>
  );
};

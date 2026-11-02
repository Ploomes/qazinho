import type { IImportFieldProps } from './types';
import { useTranslation } from 'react-i18next';
import { TargetCard } from '@/modules/Project/components/ProjectModal/components/TargetCard';
import { Button, Icon } from '@/shared/components/atoms';
import { useImportFieldViewModel } from './hooks';
import './styles.css';

/**
 * Importar os testes que o QA já tem: o botão leva ao chat do workspace com o comando
 * /import aberto.
 */
export const ImportField: React.FC<IImportFieldProps> = (props) => {
  const { canImport, buttonLabel, note, onImport } = useImportFieldViewModel(props);
  const { t } = useTranslation();

  return (
    <TargetCard
      name={t('PROJECT.IMPORT_TITLE')}
      text={t('PROJECT.IMPORT_TEXT')}
      lock={null}
      isStacked
    >
      <div className="import-field">
        <Button size="sm" variant="primary" disabled={!canImport} onClick={onImport}>
          <Icon name="folder" /> {buttonLabel}
        </Button>
        {note !== null && <p className="import-field__note">{note}</p>}
      </div>
    </TargetCard>
  );
};

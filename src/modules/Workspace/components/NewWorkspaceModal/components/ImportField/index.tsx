import type { IImportFieldProps } from './types';
import { Button, Icon, IconButton } from '@/shared/components/atoms';
import { useImportFieldViewModel } from './hooks';
import './styles.css';

/** Começar um workspace dos testes que o QA já tem: a pasta dele vira o plano no chat. */
export const ImportField: React.FC<IImportFieldProps> = (props) => {
  const {
    hasFolder,
    isPicking,
    name,
    kinds,
    path,
    pickLabel,
    removeLabel,
    failureText,
    onPick,
    onRemove,
  } = useImportFieldViewModel(props);

  return (
    <div className="import-field">
      {hasFolder ? (
        <div className="import-field__picked" title={path}>
          <Icon name="folder" />
          <span className="import-field__name">{name}</span>
          <span className="import-field__kinds">{kinds}</span>
          <IconButton icon="close" size="sm" label={removeLabel} onClick={onRemove} />
        </div>
      ) : (
        <span className="import-field__pick">
          <Button size="sm" variant="ghost" disabled={isPicking} onClick={onPick}>
            <Icon name="folder" /> {pickLabel}
          </Button>
        </span>
      )}
      {failureText !== null && <p className="import-field__note">{failureText}</p>}
    </div>
  );
};

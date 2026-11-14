import type { IReadyFieldProps } from './types';
import { Eyebrow, Icon, IconButton } from '@/shared/components/atoms';
import { SearchList, Tooltip } from '@/shared/components/molecules';
import { useReadyFieldViewModel } from './hooks';
import './styles.css';

/** A coluna do board do Jira em que uma história chegou para teste, e os status dela. */
export const ReadyField: React.FC<IReadyFieldProps> = (props) => {
  const {
    label,
    note,
    isPicking,
    picked,
    changeLabel,
    clearLabel,
    isLoading,
    loadingText,
    failure,
    hasBoardSearch,
    boardSearch,
    columnsTitle,
    columns,
    onQuery,
    onPickBoard,
    onChange,
    onClear,
  } = useReadyFieldViewModel(props);

  return (
    <div className="ready-field">
      <Eyebrow>{label}</Eyebrow>
      <p className="ready-field__note">{note}</p>

      {picked !== null && !isPicking && (
        <div className="ready-field__picked">
          <div className="ready-field__picked-text">
            <span className="ready-field__picked-name">{picked.name}</span>
            {picked.statuses !== '' && (
              <span className="ready-field__picked-statuses">{picked.statuses}</span>
            )}
          </div>
          <button type="button" className="ready-field__change" onClick={onChange}>
            {changeLabel}
          </button>
          <Tooltip content={clearLabel}>
            <IconButton icon="close" size="sm" label={clearLabel} onClick={onClear} />
          </Tooltip>
        </div>
      )}

      {isLoading && <p className="ready-field__note">{loadingText}</p>}
      {failure !== null && <p className="ready-field__failure">{failure}</p>}

      {hasBoardSearch && (
        <SearchList
          query={boardSearch.query}
          label={boardSearch.label}
          placeholder={boardSearch.placeholder}
          items={boardSearch.items}
          note={null}
          emptyText={boardSearch.emptyText}
          onQuery={onQuery}
          onPick={onPickBoard}
        />
      )}

      {columns.length > 0 && (
        <div className="ready-field__columns">
          <span className="ready-field__columns-title">{columnsTitle}</span>
          {columns.map((one) => (
            <button
              key={one.name}
              type="button"
              className="ready-field__column"
              onClick={one.onPick}
            >
              <span className="ready-field__column-name">{one.name}</span>
              <span className="ready-field__column-detail">{one.detail}</span>
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

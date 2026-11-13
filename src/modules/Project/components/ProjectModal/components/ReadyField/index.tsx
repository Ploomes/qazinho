import type { IReadyFieldProps } from './types';
import { Eyebrow, Icon, Input } from '@/shared/components/atoms';
import { useReadyFieldViewModel } from './hooks';
import './styles.css';

/** Os status do Jira em que uma história chegou para teste, ligados num toque. */
export const ReadyField: React.FC<IReadyFieldProps> = (props) => {
  const {
    label,
    note,
    isLoading,
    loadingText,
    failure,
    hasFilter,
    filterLabel,
    query,
    options,
    onQuery,
    onToggle,
  } = useReadyFieldViewModel(props);

  return (
    <div className="ready-field">
      <Eyebrow>{label}</Eyebrow>
      <p className="ready-field__note">{note}</p>
      {isLoading && <p className="ready-field__note">{loadingText}</p>}
      {failure !== null && <p className="ready-field__failure">{failure}</p>}
      {hasFilter && (
        <Input
          isCompact
          value={query}
          label={filterLabel}
          placeholder={filterLabel}
          onChange={onQuery}
        />
      )}
      {options.length > 0 && (
        <div className="ready-field__statuses">
          {options.map((option) => (
            <button
              key={option.name}
              type="button"
              aria-pressed={option.isOn}
              className={option.className}
              onClick={() => {
                onToggle(option.name);
              }}
            >
              {option.isOn && <Icon name="check" />}
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

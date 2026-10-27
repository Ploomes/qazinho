import { Button } from '@/shared/components/atoms';
import { useStorageSettingsViewModel } from './hooks';
import './styles.css';

/**
 * What QAzinho keeps on this computer, by kind, and how long it keeps run videos before
 * it lets them go.
 */
export const StorageSettings: React.FC = () => {
  const view = useStorageSettingsViewModel();

  return (
    <>
      <div className="settings__section">
        <p className="storage-settings__total">{view.total}</p>
        <ul className="storage-settings__rows">
          {view.rows.map((row) => (
            <li key={row.id} className="storage-settings__row">
              <span className="storage-settings__label">{row.label}</span>
              <span className="storage-settings__size">{row.size}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="settings__section">
        <span className="settings__eyebrow">{view.keepLabel}</span>
        <div className="settings__choices">
          {view.keeping.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.className}
              onClick={item.onPick}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="settings__note">{view.keepNote}</p>
        <div className="storage-settings__sweep">
          <Button size="sm" onClick={view.onSweep} disabled={!view.canSweep}>
            {view.sweepLabel}
          </Button>
          {view.sweptLine !== null && (
            <span className="storage-settings__swept" role="status">
              {view.sweptLine}
            </span>
          )}
        </div>
      </div>
    </>
  );
};

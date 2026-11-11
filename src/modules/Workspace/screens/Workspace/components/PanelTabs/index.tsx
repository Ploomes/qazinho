import type { IPanelTabsProps } from './types';
import { usePanelTabsViewModel } from './hooks';
import './styles.css';

/** As abas do workspace: o dispositivo, o plano, as runs e os bugs abertos contados. */
export const PanelTabs: React.FC<IPanelTabsProps> = (props) => {
  const { items, tabsLabel, onTabClick } = usePanelTabsViewModel(props);

  return (
    <div className="panel-tabs" role="tablist" aria-label={tabsLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.isActive}
          className={
            item.isActive ? 'panel-tabs__tab panel-tabs__tab--active' : 'panel-tabs__tab'
          }
          onClick={() => {
            onTabClick(item.id);
          }}
        >
          {item.label}
          {item.badge !== '' && <span className="panel-tabs__badge">{item.badge}</span>}
          {item.isLive && <span className="panel-tabs__live" />}
        </button>
      ))}
    </div>
  );
};

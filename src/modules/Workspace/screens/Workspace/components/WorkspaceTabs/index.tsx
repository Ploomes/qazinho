import type { IWorkspaceTabsProps } from './types';
import { useWorkspaceTabsViewModel } from './hooks';
import './styles.css';

export const WorkspaceTabs: React.FC<IWorkspaceTabsProps> = (props) => {
  const { items, tabsLabel, onTabClick } = useWorkspaceTabsViewModel(props);

  return (
    <div className="workspace-tabs" role="tablist" aria-label={tabsLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.isActive}
          className={
            item.isActive
              ? 'workspace-tabs__tab workspace-tabs__tab--active'
              : 'workspace-tabs__tab'
          }
          onClick={() => {
            onTabClick(item.id);
          }}
        >
          {item.label}
          {item.badge !== '' && (
            <span className="workspace-tabs__badge">{item.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
};

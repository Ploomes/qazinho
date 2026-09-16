import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/atoms';
import { BugCard } from './components';
import { useBugsViewModel } from './hooks';
import './styles.css';

export const Bugs: React.FC = () => {
  const {
    bugs,
    openBugId,
    filters,
    filter,
    isEmpty,
    summary,
    onToggleBug,
    onFilter,
    onOpenRun,
    onOpenCase,
  } = useBugsViewModel();
  const { t } = useTranslation();

  if (isEmpty) {
    return <EmptyState title={t('BUG.EMPTY_TITLE')} body={t('BUG.EMPTY_BODY')} />;
  }

  return (
    <div className="bugs">
      <div className="bugs__head">
        <span className="bugs__summary">{summary}</span>
        <div className="bugs__filters">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={
                item === filter ? 'bugs__filter bugs__filter--active' : 'bugs__filter'
              }
              onClick={() => {
                onFilter(item);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bugs__list">
        {bugs.map((bug) => (
          <BugCard
            key={bug.id}
            bug={bug}
            isOpen={openBugId === bug.id}
            onToggle={onToggleBug}
            onOpenRun={onOpenRun}
            onOpenCase={onOpenCase}
          />
        ))}
      </div>
    </div>
  );
};

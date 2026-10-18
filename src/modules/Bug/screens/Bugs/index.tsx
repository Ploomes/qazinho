import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/components/atoms';
import { BugCard } from './components';
import { useBugsViewModel } from './hooks';
import './styles.css';

export const Bugs: React.FC = () => {
  const {
    bugs,
    openBugId,
    filters,
    isEmpty,
    summary,
    onToggleBug,
    onFilter,
    onOpenRun,
    onOpenCase,
  } = useBugsViewModel();
  const { t } = useTranslation();

  if (isEmpty) {
    return (
      <EmptyState mood="passed" title={t('BUG.EMPTY_TITLE')} body={t('BUG.EMPTY_BODY')} />
    );
  }

  return (
    <div className="bugs">
      <div className="bugs__head">
        <span className="bugs__summary">{summary}</span>
        <div className="bugs__filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.isActive ? 'bugs__filter bugs__filter--active' : 'bugs__filter'
              }
              onClick={() => {
                onFilter(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bugs__list">
        {bugs.map(({ bug, hasRun }) => (
          <BugCard
            key={bug.id}
            bug={bug}
            hasRun={hasRun}
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

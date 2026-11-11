import { BugThumb } from '@/modules/Bug/components';
import { EmptyState } from '@/shared/components/atoms';
import { useAllBugsViewModel } from './hooks';
import './styles.css';

/** Os bugs de todos os projetos e planos, para a triagem do app inteiro. */
export const AllBugs: React.FC = () => {
  const { style, title, summary, isEmpty, emptyTitle, emptyBody, emptyTab, tabs, rows } =
    useAllBugsViewModel();

  return (
    <section className="all-bugs" style={style}>
      <div className="all-bugs__column">
        <h1 className="all-bugs__title">{title}</h1>

        {isEmpty ? (
          <EmptyState mood="passed" title={emptyTitle} body={emptyBody} />
        ) : (
          <>
            <p className="all-bugs__summary">{summary}</p>

            <div className="all-bugs__tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className={tab.className}
                  aria-selected={tab.isActive}
                  onClick={tab.onClick}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="all-bugs__count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {rows.length === 0 ? (
              <p className="all-bugs__none">{emptyTab}</p>
            ) : (
              <div className="all-bugs__list">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="all-bugs__row"
                    onClick={row.onOpen}
                  >
                    <BugThumb src={row.thumb.src} file={row.thumb.file} />
                    <span className="all-bugs__text">
                      <span className="all-bugs__name">{row.title}</span>
                      <span className="all-bugs__where">{row.where}</span>
                    </span>
                    <span className="all-bugs__seen">{row.seen}</span>
                    <span className="all-bugs__when">{row.when}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

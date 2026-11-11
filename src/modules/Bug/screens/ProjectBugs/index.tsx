import { BugThumb } from '@/modules/Bug/components';
import { EmptyState } from '@/shared/components/atoms';
import { useProjectBugsViewModel } from './hooks';
import './styles.css';

/** Os bugs de um projeto, de todos os planos dele, para a triagem do app inteiro. */
export const ProjectBugs: React.FC = () => {
  const {
    hasProject,
    style,
    title,
    summary,
    isEmpty,
    emptyTitle,
    emptyBody,
    emptyTab,
    tabs,
    rows,
  } = useProjectBugsViewModel();

  if (!hasProject) return null;

  return (
    <section className="project-bugs" style={style}>
      <div className="project-bugs__column">
        <h1 className="project-bugs__title">{title}</h1>

        {isEmpty ? (
          <EmptyState mood="passed" title={emptyTitle} body={emptyBody} />
        ) : (
          <>
            <p className="project-bugs__summary">{summary}</p>

            <div className="project-bugs__tabs" role="tablist">
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
                    <span className="project-bugs__count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {rows.length === 0 ? (
              <p className="project-bugs__none">{emptyTab}</p>
            ) : (
              <div className="project-bugs__list">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="project-bugs__row"
                    onClick={row.onOpen}
                  >
                    <BugThumb src={row.thumb.src} file={row.thumb.file} />
                    <span className="project-bugs__text">
                      <span className="project-bugs__name">{row.title}</span>
                      <span className="project-bugs__where">{row.where}</span>
                    </span>
                    <span className="project-bugs__seen">{row.seen}</span>
                    <span className="project-bugs__when">{row.when}</span>
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

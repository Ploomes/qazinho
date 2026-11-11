import { ProjectMark } from '@/modules/Project';
import { Button, Icon } from '@/shared/components/atoms';
import { useHomeViewModel } from './hooks';
import './styles.css';

/**
 * Onde o app abre: o que pede o QA agora em todos os projetos, uma linha e uma ação por
 * plano, e os planos abertos por último.
 */
export const Home: React.FC = () => {
  const {
    style,
    title,
    lead,
    isQuiet,
    quiet,
    groups,
    hasRecent,
    recentTitle,
    markSize,
    recent,
  } = useHomeViewModel();

  return (
    <section className="home" style={style}>
      <div className="home__column">
        <h1 className="home__title">{title}</h1>
        <p className="home__lead">{lead}</p>

        {isQuiet && <p className="home__quiet">{quiet}</p>}

        {groups.map((group) => (
          <div key={group.id} className="home__group">
            <h2 className="home__group-title">{group.title}</h2>
            {group.items.map((item) => (
              <div key={item.id} className="home__item">
                <span
                  className="home__glyph"
                  style={{ color: item.tone, animation: item.animation }}
                >
                  <Icon name={item.icon} />
                </span>
                <span className="home__text">
                  <span className="home__line">{item.text}</span>
                  <span className="home__project">{item.project}</span>
                </span>
                <Button size="sm" variant="secondary" onClick={item.onAction}>
                  {item.action}
                </Button>
              </div>
            ))}
          </div>
        ))}

        {hasRecent && (
          <div className="home__group">
            <h2 className="home__group-title">{recentTitle}</h2>
            {recent.map((row) => (
              <button
                key={row.id}
                type="button"
                className="home__recent"
                onClick={row.onOpen}
              >
                <ProjectMark mark={row.mark} size={markSize} />
                <span className="home__recent-plan">{row.plan}</span>
                <span className="home__project">{row.project}</span>
                <span className="home__when">{row.when}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

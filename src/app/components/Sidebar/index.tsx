import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ProAccountCard } from '@/modules/Pro';
import { ProjectMark } from '@/modules/Project';
import { Caret, Icon, IconButton, Kbd, PlatformIcon } from '@/shared/components/atoms';
import { Fold, Tooltip } from '@/shared/components/molecules';
import { STICKER } from '@/shared/constants';
import { useSidebarViewModel } from './hooks';
import './styles.css';

export const Sidebar: React.FC = () => {
  const {
    className,
    style,
    isShut,
    hasTips,
    onSelectProject,
    searchLabel,
    searchCombo,
    onSearch,
    groups,
    onToggleProject,
    waitingName,
    onOpenWaiting,
    onSelectWorkspace,
    onNewWorkspace,
    onProjectBugs,
    bugsLabel,
    onNewProject,
    onSettings,
    onAskRemove,
    onRemoveWorkspace,
    onProjectSettings,
    onProSettings,
    markSize,
    homeLabel,
    isHome,
    homeCount,
    onHome,
  } = useSidebarViewModel();
  const { t } = useTranslation();

  return (
    <nav className={className} style={style}>
      <AnimatePresence>
        {waitingName !== null && (
          <motion.button
            type="button"
            className="sidebar__banner"
            initial={STICKER.panel.initial}
            animate={STICKER.panel.animate}
            exit={STICKER.panel.exit}
            onClick={onOpenWaiting}
          >
            <Tooltip
              side="right"
              isOff={!hasTips}
              content={
                <span className="sidebar__tip">
                  <span className="sidebar__tip-name">{waitingName}</span>
                  <span className="sidebar__tip-detail">{t('SIDEBAR.ASKED_YOU')}</span>
                </span>
              }
            >
              <span className="sidebar__banner-icon">
                <Icon name="ask" />
              </span>
            </Tooltip>
            <span className="sidebar__banner-text">
              <span className="sidebar__banner-name">{waitingName}</span>
              <span className="sidebar__banner-said">{t('SIDEBAR.ASKED_YOU')}</span>
            </span>
            <span className="sidebar__banner-go">
              <Icon name="arrow" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {isShut ? (
        <>
          <div className="sidebar__rail">
            <Tooltip side="right" content={homeLabel}>
              <button
                type="button"
                className={
                  isHome
                    ? 'sidebar__rail-tile sidebar__rail-tile--selected'
                    : 'sidebar__rail-tile'
                }
                aria-label={homeLabel}
                aria-current={isHome ? 'page' : undefined}
                onClick={onHome}
              >
                <Icon name="home" />
                {homeCount !== null && (
                  <span className="sidebar__rail-count">{homeCount}</span>
                )}
              </button>
            </Tooltip>
            {groups.map((group) => (
              <div key={group.id} className="sidebar__rail-group">
                <Tooltip side="right" content={group.name}>
                  <button
                    type="button"
                    className={
                      group.isSelected
                        ? 'sidebar__rail-avatar sidebar__rail-avatar--selected'
                        : 'sidebar__rail-avatar'
                    }
                    aria-label={t('SIDEBAR.PROJECT_SELECT', { name: group.name })}
                    onClick={() => {
                      onSelectProject(group.projectId);
                    }}
                  >
                    <ProjectMark mark={group.mark} size={markSize} />
                  </button>
                </Tooltip>

                {group.isExpanded &&
                  group.rows.map((row) => {
                    if (row.kind === 'add') {
                      return (
                        <Tooltip
                          key={row.id}
                          side="right"
                          content={t('SIDEBAR.NEW_WORKSPACE')}
                        >
                          <button
                            type="button"
                            className="sidebar__rail-tile sidebar__rail-tile--add"
                            aria-label={t('SIDEBAR.NEW_WORKSPACE')}
                            onClick={() => {
                              onNewWorkspace(row.projectId);
                            }}
                          >
                            <Icon name="plus" />
                          </button>
                        </Tooltip>
                      );
                    }

                    if (row.kind === 'bugs') {
                      return (
                        <Tooltip key={row.id} side="right" content={bugsLabel}>
                          <button
                            type="button"
                            className={
                              row.isSelected
                                ? 'sidebar__rail-tile sidebar__rail-tile--selected'
                                : 'sidebar__rail-tile'
                            }
                            aria-label={bugsLabel}
                            onClick={() => {
                              onProjectBugs(row.projectId);
                            }}
                          >
                            <Icon name="bug" />
                            {row.count !== null && (
                              <span className="sidebar__rail-count">{row.count}</span>
                            )}
                          </button>
                        </Tooltip>
                      );
                    }

                    return (
                      <Tooltip
                        key={row.id}
                        side="right"
                        content={
                          <span className="sidebar__tip">
                            <span className="sidebar__tip-name">{row.name}</span>
                            <span className="sidebar__tip-detail">
                              <span style={{ color: row.tone }}>{row.statusLabel}</span>
                              <span>{row.meta}</span>
                            </span>
                          </span>
                        }
                      >
                        <button
                          type="button"
                          className={
                            row.isSelected
                              ? 'sidebar__rail-tile sidebar__rail-tile--selected'
                              : 'sidebar__rail-tile'
                          }
                          aria-label={t('SIDEBAR.ROW_LABEL', {
                            name: row.name,
                            status: row.statusLabel,
                          })}
                          onClick={() => {
                            onSelectWorkspace(row.id);
                          }}
                        >
                          {row.kind === 'workspace' && row.platform !== null && (
                            <PlatformIcon kind={row.platform} size={16} />
                          )}
                          <span
                            className="sidebar__badge"
                            style={{ color: row.tone, animation: row.animation }}
                          >
                            <Icon name={row.icon} />
                          </span>
                        </button>
                      </Tooltip>
                    );
                  })}
              </div>
            ))}

            <Tooltip side="right" content={t('SIDEBAR.NEW_PROJECT')}>
              <button
                type="button"
                className="sidebar__rail-add"
                aria-label={t('SIDEBAR.NEW_PROJECT')}
                onClick={onNewProject}
              >
                <Icon name="plus" />
              </button>
            </Tooltip>
          </div>

          <div className="sidebar__rail-foot">
            <ProAccountCard />
            <Tooltip side="right" content={t('COMMON.SETTINGS')}>
              <IconButton
                icon="settings"
                label={t('COMMON.SETTINGS')}
                onClick={onSettings}
              />
            </Tooltip>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className={isHome ? 'sidebar__nav sidebar__nav--selected' : 'sidebar__nav'}
            aria-current={isHome ? 'page' : undefined}
            onClick={onHome}
          >
            <Icon name="home" />
            <span className="sidebar__label">{homeLabel}</span>
            {homeCount !== null && <span className="sidebar__count">{homeCount}</span>}
          </button>

          <button type="button" className="sidebar__nav" onClick={onSearch}>
            <Icon name="search" />
            <span className="sidebar__label">{searchLabel}</span>
            {searchCombo !== '' && <Kbd combo={searchCombo} />}
          </button>

          <div className="sidebar__section">
            <span className="sidebar__heading">{t('SIDEBAR.PROJECTS')}</span>
            <Tooltip side="right" content={t('SIDEBAR.NEW_PROJECT')}>
              <IconButton
                icon="plus"
                size="sm"
                label={t('SIDEBAR.NEW_PROJECT')}
                onClick={onNewProject}
              />
            </Tooltip>
          </div>

          <div className="sidebar__groups">
            <AnimatePresence initial={false}>
              {groups.map((group) => (
                <Fold key={group.id} className="sidebar__group">
                  <div className="sidebar__group-head-row">
                    <button
                      type="button"
                      className="sidebar__group-head"
                      aria-expanded={group.isExpanded}
                      onClick={() => {
                        onToggleProject(group.projectId);
                      }}
                    >
                      <ProjectMark mark={group.mark} size={markSize} />
                      <span className="sidebar__group-text">
                        <span className="sidebar__group-title">
                          <span className="sidebar__group-name">{group.name}</span>
                          <span className="sidebar__group-caret">
                            <Caret isOpen={group.isExpanded} />
                          </span>
                        </span>
                        {group.hasPlace && (
                          <span className="sidebar__group-place">{group.place}</span>
                        )}
                      </span>
                    </button>

                    {group.pro !== null && (
                      <button
                        type="button"
                        className="sidebar__pro"
                        aria-label={group.pro.label}
                        title={group.pro.tip}
                        onClick={() => {
                          onProSettings(group.projectId);
                        }}
                      >
                        <Icon name="cloud" size={14} />
                        {group.pro.hasPending && (
                          <span className="sidebar__pro-count">
                            <Icon name="up" size={12} />
                            {group.pro.pending}
                          </span>
                        )}
                        {group.pro.hasUpdates && (
                          <span className="sidebar__pro-count sidebar__pro-count--in">
                            <Icon name="download" size={12} />
                            {group.pro.updates}
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      className="sidebar__project-settings"
                      aria-label={t('SIDEBAR.PROJECT_SETTINGS', { name: group.name })}
                      onClick={() => {
                        onProjectSettings(group.projectId);
                      }}
                    >
                      <span className="sidebar__project-settings-icon">
                        <Icon name="settings" size={12} />
                      </span>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {group.isExpanded && (
                      <Fold key="body" className="sidebar__group-body">
                        <AnimatePresence initial={false}>
                          {group.rows.map((row) => {
                            if (row.kind === 'add') {
                              return (
                                <Fold key={row.id} className="sidebar__slot">
                                  <button
                                    type="button"
                                    className="sidebar__add"
                                    onClick={() => {
                                      onNewWorkspace(row.projectId);
                                    }}
                                  >
                                    <span className="sidebar__add-icon">
                                      <Icon name="plus" />
                                    </span>
                                    <span className="sidebar__label">
                                      {t('SIDEBAR.NEW_WORKSPACE')}
                                    </span>
                                  </button>
                                </Fold>
                              );
                            }

                            if (row.kind === 'bugs') {
                              return (
                                <Fold key={row.id} className="sidebar__slot">
                                  <button
                                    type="button"
                                    className={
                                      row.isSelected
                                        ? 'sidebar__row sidebar__row--selected sidebar__bugs'
                                        : 'sidebar__row sidebar__bugs'
                                    }
                                    aria-current={row.isSelected ? 'page' : undefined}
                                    onClick={() => {
                                      onProjectBugs(row.projectId);
                                    }}
                                  >
                                    <span className="sidebar__name">{bugsLabel}</span>
                                    {row.count !== null && (
                                      <span className="sidebar__bugs-count">
                                        {row.count}
                                      </span>
                                    )}
                                  </button>
                                </Fold>
                              );
                            }

                            return (
                              <Fold key={row.id} className="sidebar__slot">
                                <div
                                  className={
                                    row.isSelected
                                      ? 'sidebar__row sidebar__row--selected'
                                      : 'sidebar__row'
                                  }
                                >
                                  <button
                                    type="button"
                                    className="sidebar__open"
                                    aria-label={row.label}
                                    onClick={() => {
                                      onSelectWorkspace(row.id);
                                    }}
                                  >
                                    <span className="sidebar__name">{row.name}</span>
                                    {row.signal !== null && (
                                      <span
                                        className={
                                          row.isRemoving
                                            ? 'sidebar__signal sidebar__signal--hidden'
                                            : 'sidebar__signal'
                                        }
                                        title={row.signal.label}
                                        style={{
                                          color: row.signal.tone,
                                          animation: row.signal.animation,
                                        }}
                                      >
                                        <Icon name={row.signal.icon} />
                                        {row.signal.count}
                                      </span>
                                    )}
                                  </button>

                                  {row.isRemoving ? (
                                    <span className="sidebar__confirm">
                                      <button
                                        type="button"
                                        className="sidebar__confirm-yes"
                                        onClick={() => {
                                          onRemoveWorkspace(row.id);
                                        }}
                                      >
                                        {t('SIDEBAR.REMOVE_YES')}
                                      </button>
                                      <button
                                        type="button"
                                        className="sidebar__confirm-no"
                                        onClick={() => {
                                          onAskRemove(null);
                                        }}
                                      >
                                        {t('SIDEBAR.REMOVE_NO')}
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="sidebar__remove"
                                      aria-label={t('SIDEBAR.REMOVE', { name: row.name })}
                                      onClick={() => {
                                        onAskRemove(row.id);
                                      }}
                                    >
                                      <Icon name="close" />
                                    </button>
                                  )}
                                </div>
                              </Fold>
                            );
                          })}
                        </AnimatePresence>
                      </Fold>
                    )}
                  </AnimatePresence>
                </Fold>
              ))}
            </AnimatePresence>
          </div>

          <div className="sidebar__foot">
            <ProAccountCard />
            <Tooltip content={t('COMMON.SETTINGS')}>
              <IconButton
                icon="settings"
                size="sm"
                label={t('COMMON.SETTINGS')}
                onClick={onSettings}
              />
            </Tooltip>
          </div>
        </>
      )}
    </nav>
  );
};

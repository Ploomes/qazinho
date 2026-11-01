import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ProAccountCard } from '@/modules/Pro';
import { Caret, Icon, IconButton, Kbd, PlatformIcon } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { STICKER } from '@/shared/constants';
import { useSidebarViewModel } from './hooks';
import './styles.css';

export const Sidebar: React.FC = () => {
  const {
    className,
    isShut,
    toggleLabel,
    onToggle,
    hasTips,
    projectAvatars,
    onSelectProject,
    filter,
    filterRef,
    onFilterChange,
    groups,
    onToggleProject,
    waitingName,
    onOpenWaiting,
    onSelectWorkspace,
    onNewWorkspace,
    onNewProject,
    onSettings,
    onAskRemove,
    onRemoveWorkspace,
    onProjectSettings,
    onProSettings,
    onOpenSuite,
  } = useSidebarViewModel();
  const { t } = useTranslation();

  return (
    <nav className={className}>
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
            {projectAvatars.map((avatar) => (
              <Tooltip
                key={avatar.id}
                side="right"
                isOff={!hasTips}
                content={avatar.name}
              >
                <button
                  type="button"
                  className={
                    avatar.isSelected
                      ? 'sidebar__rail-avatar sidebar__rail-avatar--selected'
                      : 'sidebar__rail-avatar'
                  }
                  aria-label={t('SIDEBAR.PROJECT_SELECT', { name: avatar.name })}
                  onClick={() => {
                    onSelectProject(avatar.projectId);
                  }}
                >
                  {avatar.initial}
                </button>
              </Tooltip>
            ))}
            <Tooltip side="right" isOff={!hasTips} content={t('SIDEBAR.NEW_PROJECT')}>
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

          <div className="sidebar__rail-spacer" />

          <div className="sidebar__rail-foot">
            <IconButton icon="sidebar" label={toggleLabel} onClick={onToggle} />
            <ProAccountCard />
            <IconButton
              icon="settings"
              label={t('COMMON.SETTINGS')}
              onClick={onSettings}
            />
          </div>
        </>
      ) : (
        <>
          <div className="sidebar__head">
            <span className="sidebar__eyebrow">{t('SIDEBAR.WORKSPACES')}</span>
            <button type="button" className="sidebar__head-toggle" onClick={onToggle}>
              {toggleLabel}
              <Kbd combo="⌘B" />
            </button>
          </div>

          <div className="sidebar__filter">
            <Icon name="search" size={14} />
            <input
              ref={filterRef}
              className="sidebar__filter-input"
              value={filter}
              placeholder={t('SIDEBAR.FILTER_PLACEHOLDER')}
              aria-label={t('SIDEBAR.FILTER_LABEL')}
              onChange={(event) => {
                onFilterChange(event.target.value);
              }}
            />
            <Kbd combo="/" />
          </div>

          <div className="sidebar__groups">
            {groups.map((group) => (
              <div key={group.id} className="sidebar__group">
                <div className="sidebar__group-head-row">
                  <button
                    type="button"
                    className="sidebar__group-head"
                    aria-expanded={group.isExpanded}
                    onClick={() => {
                      onToggleProject(group.projectId);
                    }}
                  >
                    <Caret isOpen={group.isExpanded} />
                    <span className="sidebar__group-avatar" aria-hidden="true">
                      {group.initial}
                    </span>
                    <span className="sidebar__group-name">{group.name}</span>
                    {!group.isExpanded && (
                      <span className="sidebar__group-meta">{group.meta}</span>
                    )}
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
                      <Icon name="link" size={12} />
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

                {group.isExpanded && (
                  <div className="sidebar__group-body">
                    {group.rows.map((row) => {
                      if (row.kind === 'suite') {
                        return (
                          <div
                            key={row.id}
                            className={
                              row.isSelected
                                ? 'sidebar__row sidebar__row--selected'
                                : 'sidebar__row'
                            }
                          >
                            <button
                              type="button"
                              className="sidebar__open"
                              onClick={() => {
                                onOpenSuite(row.projectId);
                              }}
                            >
                              <span className="sidebar__platform">
                                <Icon name="suite" size={15} />
                              </span>
                              <span className="sidebar__text">
                                <span className="sidebar__name">{row.name}</span>
                                <span className="sidebar__detail">
                                  <span
                                    className="sidebar__icon"
                                    style={{ color: row.tone, animation: row.animation }}
                                  >
                                    <Icon name={row.icon} />
                                  </span>
                                  <span style={{ color: row.tone }}>
                                    {row.statusLabel}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="sidebar__meta">{row.meta}</span>
                                </span>
                              </span>
                            </button>
                          </div>
                        );
                      }

                      if (row.kind === 'add') {
                        return (
                          <button
                            key={row.id}
                            type="button"
                            className="sidebar__add"
                            onClick={() => {
                              onNewWorkspace(row.projectId);
                            }}
                          >
                            <Icon name="plus" />
                            <span className="sidebar__label">
                              {t('SIDEBAR.NEW_WORKSPACE')}
                            </span>
                            <Kbd combo="⌘N" />
                          </button>
                        );
                      }

                      return (
                        <div
                          key={row.id}
                          className={
                            row.isSelected
                              ? 'sidebar__row sidebar__row--selected'
                              : 'sidebar__row'
                          }
                        >
                          <button
                            type="button"
                            className="sidebar__open"
                            onClick={() => {
                              onSelectWorkspace(row.id);
                            }}
                          >
                            <span className="sidebar__platform">
                              {row.platform !== null && (
                                <PlatformIcon kind={row.platform} size={15} />
                              )}
                            </span>
                            <span className="sidebar__text">
                              <span className="sidebar__name">{row.name}</span>
                              <span
                                className={
                                  row.isRemoving
                                    ? 'sidebar__detail sidebar__detail--hidden'
                                    : 'sidebar__detail'
                                }
                              >
                                <span
                                  className="sidebar__icon"
                                  style={{ color: row.tone, animation: row.animation }}
                                >
                                  <Icon name={row.icon} />
                                </span>
                                <span style={{ color: row.tone }}>{row.statusLabel}</span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={
                                    row.isWaiting
                                      ? 'sidebar__meta sidebar__meta--waiting'
                                      : 'sidebar__meta'
                                  }
                                >
                                  {row.meta}
                                </span>
                              </span>
                            </span>
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
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              className="sidebar__add sidebar__add--project"
              onClick={onNewProject}
            >
              <Icon name="plus" />
              <span className="sidebar__label">{t('SIDEBAR.NEW_PROJECT')}</span>
            </button>
          </div>

          <ProAccountCard />

          <div className="sidebar__foot">
            <IconButton
              icon="settings"
              label={t('COMMON.SETTINGS')}
              onClick={onSettings}
            />
            <IconButton icon="sidebar" label={toggleLabel} onClick={onToggle} />
          </div>
        </>
      )}
    </nav>
  );
};

import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Icon, PlatformIcon, Tag } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useSidebarViewModel } from './hooks';
import './styles.css';

export const Sidebar: React.FC = () => {
  const {
    rows,
    waitingName,
    onOpenWaiting,
    onSelectWorkspace,
    onNewWorkspace,
    onNewProject,
    onSettings,
    onAskRemove,
    onRemoveWorkspace,
    onProjectSettings,
    onOpenSuite,
  } = useSidebarViewModel();
  const { t } = useTranslation();

  return (
    <nav className="sidebar">
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
            <span className="sidebar__banner-icon">
              <Icon name="ask" />
            </span>
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

      <div className="sidebar__rows">
        {rows.map((row) => {
          if (row.kind === 'header') {
            return (
              <div key={row.id} className="sidebar__project">
                <span className="sidebar__project-name">
                  <Tag>{row.name}</Tag>
                </span>
                <button
                  type="button"
                  className="sidebar__project-settings"
                  aria-label={t('SIDEBAR.PROJECT_SETTINGS', { name: row.name })}
                  onClick={() => {
                    onProjectSettings(row.projectId);
                  }}
                >
                  <span className="sidebar__project-settings-icon">
                    <Icon name="settings" size={14} />
                  </span>
                </button>
              </div>
            );
          }

          if (row.kind === 'suite') {
            return (
              <div
                key={row.id}
                className={
                  row.isSelected ? 'sidebar__row sidebar__row--selected' : 'sidebar__row'
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
                      <span style={{ color: row.tone }}>{row.statusLabel}</span>
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
                {t('SIDEBAR.NEW_WORKSPACE')}
              </button>
            );
          }

          return (
            <div
              key={row.id}
              className={
                row.isSelected ? 'sidebar__row sidebar__row--selected' : 'sidebar__row'
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

      <button
        type="button"
        className="sidebar__add sidebar__add--project"
        onClick={onNewProject}
      >
        <Icon name="plus" />
        {t('SIDEBAR.NEW_PROJECT')}
      </button>

      <button type="button" className="sidebar__settings" onClick={onSettings}>
        <Icon name="settings" />
        {t('COMMON.SETTINGS')}
      </button>
    </nav>
  );
};

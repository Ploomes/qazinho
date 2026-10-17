import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { PlatformIcon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { GEAR_PATH } from './constants';
import { useSidebarViewModel } from './hooks';
import './styles.css';

export const Sidebar: React.FC = () => {
  const {
    rows,
    waitingName,
    onSelectWorkspace,
    onNewWorkspace,
    onNewProject,
    onSettings,
    onAskRemove,
    onRemoveWorkspace,
    onProjectSettings,
  } = useSidebarViewModel();
  const { t } = useTranslation();

  return (
    <nav className="sidebar">
      <AnimatePresence>
        {waitingName !== null && (
          <motion.div
            className="sidebar__banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <span className="sidebar__banner-glyph">!</span>
            <span className="sidebar__banner-name">{waitingName}</span>
            <span className="sidebar__banner-text">{t('SIDEBAR.ASKED_YOU')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sidebar__rows">
        {rows.map((row) => {
          if (row.kind === 'header') {
            return (
              <div key={row.id} className="sidebar__project">
                <span className="sidebar__project-name">{row.name}</span>
                <button
                  type="button"
                  className="sidebar__project-settings"
                  aria-label={t('SIDEBAR.PROJECT_SETTINGS', { name: row.name })}
                  onClick={() => {
                    onProjectSettings(row.projectId);
                  }}
                >
                  <svg
                    className="sidebar__project-settings-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={GEAR_PATH} />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
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
                <span aria-hidden="true">+</span>
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
                      className="sidebar__glyph"
                      style={{ color: row.tone, animation: row.animation }}
                      aria-hidden="true"
                    >
                      {row.glyph}
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
                  ✕
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
        <span aria-hidden="true">+</span>
        {t('SIDEBAR.NEW_PROJECT')}
      </button>

      <button type="button" className="sidebar__settings" onClick={onSettings}>
        <span aria-hidden="true">⚙</span>
        {t('COMMON.SETTINGS')}
      </button>
    </nav>
  );
};

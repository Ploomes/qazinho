import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/constants';
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
                {row.name}
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
            <button
              key={row.id}
              type="button"
              className={
                row.isSelected ? 'sidebar__row sidebar__row--selected' : 'sidebar__row'
              }
              onClick={() => {
                onSelectWorkspace(row.id);
              }}
            >
              <span
                className="sidebar__glyph"
                style={{ color: row.tone, animation: row.animation }}
                aria-hidden="true"
              >
                {row.glyph}
              </span>
              <span className="sidebar__name">{row.name}</span>
              <span
                className={
                  row.isWaiting ? 'sidebar__meta sidebar__meta--waiting' : 'sidebar__meta'
                }
              >
                {row.meta}
              </span>
            </button>
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

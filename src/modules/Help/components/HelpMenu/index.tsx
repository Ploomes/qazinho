import type { IHelpMenuProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon, IconButton } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { useHelpMenuViewModel } from './hooks';
import './styles.css';

/**
 * O botão de ajuda: as novidades das últimas versões, os guias, o Discord, e um e-mail
 * para relatar um problema ou mandar um comentário.
 */
export const HelpMenu: React.FC<IHelpMenuProps> = (props) => {
  const {
    anchorRef,
    menuRef,
    label,
    isOpen,
    menuStyle,
    news,
    onToggle,
    onNews,
    onGuides,
    onDiscord,
    onReport,
    onFeedback,
    tipSide,
    buttonSize,
    entry,
  } = useHelpMenuViewModel(props);
  const { t } = useTranslation();

  return (
    <span ref={anchorRef} className="help-menu">
      <Tooltip side={tipSide} isOff={isOpen} content={label}>
        <IconButton
          icon="help"
          size={buttonSize}
          label={label}
          popup="menu"
          isActive={isOpen}
          onClick={onToggle}
        />
      </Tooltip>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="help"
              ref={menuRef}
              className="help-menu__menu"
              role="menu"
              aria-label={label}
              style={menuStyle}
              initial={entry.initial}
              animate={entry.animate}
              exit={entry.exit}
            >
              {news.length > 0 && (
                <>
                  <span className="help-menu__eyebrow">{t('HELP.NEWS')}</span>
                  {news.map((line) => (
                    <button
                      key={line.key}
                      type="button"
                      role="menuitem"
                      className="help-menu__news"
                      onClick={onNews}
                    >
                      <span className="help-menu__headline" title={line.text}>
                        {line.text}
                      </span>
                      <span className="help-menu__day">{line.day}</span>
                    </button>
                  ))}
                </>
              )}
              <button
                type="button"
                role="menuitem"
                className="help-menu__item"
                onClick={onNews}
              >
                <Icon name="news" />
                {t('HELP.ALL_NEWS')}
              </button>

              <span className="help-menu__line" role="separator" />

              <button
                type="button"
                role="menuitem"
                className="help-menu__item"
                onClick={onGuides}
              >
                <Icon name="guides" />
                {t('HELP.GUIDES')}
                <span className="help-menu__out">
                  <Icon name="external" />
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="help-menu__item"
                onClick={onDiscord}
              >
                <Icon name="discord" />
                {t('HELP.DISCORD')}
                <span className="help-menu__out">
                  <Icon name="external" />
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="help-menu__item"
                onClick={onReport}
              >
                <Icon name="bug" />
                {t('HELP.REPORT')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="help-menu__item"
                onClick={onFeedback}
              >
                <Icon name="feedback" />
                {t('HELP.FEEDBACK')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
};

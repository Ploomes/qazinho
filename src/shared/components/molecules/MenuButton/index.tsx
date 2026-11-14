import type { IMenuButtonProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useMenuButtonViewModel } from './hooks';
import './styles.css';

/** Um botão discreto que abre, logo abaixo, as escolhas que ele junta. */
export const MenuButton: React.FC<IMenuButtonProps> = (props) => {
  const { ref, isOpen, label, icon, caretClassName, items, onToggle } =
    useMenuButtonViewModel(props);

  return (
    <div ref={ref} className="menu-button">
      <Button variant="ghost" size="sm" popup="menu" expanded={isOpen} onClick={onToggle}>
        <Icon name={icon} />
        {label}
        <span className={caretClassName}>
          <Icon name="caretDown" />
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="menu"
            className="menu-button__menu"
            role="menu"
            aria-label={label}
            initial={STICKER.pop.initial}
            animate={STICKER.pop.animate}
            exit={STICKER.pop.exit}
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className="menu-button__item"
                title={item.tip}
                disabled={item.isDisabled}
                onClick={item.onPick}
              >
                <Icon name={item.icon} />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

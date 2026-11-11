import { motion } from 'motion/react';
import { SearchList } from '@/shared/components/molecules';
import { MOTION, STICKER } from '@/shared/constants';
import { useSearchPaletteViewModel } from './hooks';
import './styles.css';

/** A busca do ⌘K: abre qualquer plano, roda um, vai aos bugs ou troca de projeto. */
export const SearchPalette: React.FC = () => {
  const { style, query, label, placeholder, items, emptyText, onQuery, onPick, onClose } =
    useSearchPaletteViewModel();

  return (
    <motion.div
      className="search-palette"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
      onClick={onClose}
    >
      <motion.div
        className="search-palette__panel"
        role="dialog"
        aria-label={label}
        initial={STICKER.pop.initial}
        animate={STICKER.pop.animate}
        exit={STICKER.pop.exit}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <SearchList
          query={query}
          label={label}
          placeholder={placeholder}
          items={items}
          note={null}
          emptyText={emptyText}
          isOpen
          isAutoFocused
          onQuery={onQuery}
          onPick={onPick}
          onEscape={onClose}
        />
      </motion.div>
    </motion.div>
  );
};

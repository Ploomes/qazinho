import type { ISearchListProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { MOTION } from '@/shared/constants';
import { useSearchListViewModel } from './hooks';
import './styles.css';

/**
 * Um campo que estreita uma lista enquanto o QA digita, e escolhe com um clique ou o
 * teclado.
 */
export const SearchList: React.FC<ISearchListProps> = (props) => {
  const {
    listId,
    listRef,
    foldRef,
    style,
    isOpen,
    message,
    rows,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onHighlight,
    onFoldDone,
    onPickRow,
  } = useSearchListViewModel(props);

  return (
    <div className="search-list" style={style}>
      <span className="search-list__field">
        <span className="search-list__glass" aria-hidden="true" />
        <input
          className="search-list__input"
          role="combobox"
          aria-label={props.label}
          aria-expanded={isOpen}
          aria-controls={listId}
          value={props.query}
          placeholder={props.placeholder}
          autoComplete="off"
          spellCheck={false}
          autoFocus={props.isAutoFocused}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      </span>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            ref={foldRef}
            key="list"
            className="search-list__fold"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            onAnimationComplete={onFoldDone}
          >
            <div className="search-list__body">
              {rows.length > 0 && (
                <ul
                  ref={listRef}
                  id={listId}
                  className="search-list__items"
                  role="listbox"
                >
                  {rows.map((row, index) => (
                    <li key={row.id} className="search-list__entry">
                      <button
                        type="button"
                        role="option"
                        aria-selected={row.isActive}
                        className={row.className}
                        onPointerDown={(event) => {
                          event.preventDefault();
                        }}
                        onPointerEnter={() => {
                          onHighlight(index);
                        }}
                        onClick={() => {
                          onPickRow(row.id);
                        }}
                      >
                        <span className="search-list__label">{row.label}</span>
                        {row.tag !== null && (
                          <span className="search-list__tag">{row.tag}</span>
                        )}
                        {row.detail !== null && (
                          <span className="search-list__detail">{row.detail}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {message !== null && <p className="search-list__note">{message}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

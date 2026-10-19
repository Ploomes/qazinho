import type { IComposerProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { MentionPicker } from './components';
import { useComposerViewModel } from './hooks';
import './styles.css';

export const Composer: React.FC<IComposerProps> = (props) => {
  const {
    mirrorRef,
    parts,
    onInputScroll,
    canPress,
    isLocked,
    button,
    glyphMotion,
    placeholder,
    fieldClassName,
    isPickerOpen,
    highlighted,
    shown,
    tabs,
    onButtonClick,
    onPick,
    onHighlight,
    onTab,
    onInputChange,
    onKeyDown,
  } = useComposerViewModel(props);

  return (
    <div className="composer">
      <div className={fieldClassName}>
        <AnimatePresence>
          {isPickerOpen && (
            <MentionPicker
              key="mentions"
              references={shown}
              tabs={tabs}
              query={props.mentionQuery ?? ''}
              hasReferences={props.hasReferences}
              highlighted={highlighted}
              onPick={onPick}
              onHighlight={onHighlight}
              onTab={onTab}
            />
          )}
        </AnimatePresence>

        <div className="composer__text">
          <div ref={mirrorRef} className="composer__mirror" aria-hidden="true">
            {parts.map((part) =>
              part.isMention ? (
                <span key={part.key} className="composer__mention">
                  {part.text}
                </span>
              ) : (
                part.text
              ),
            )}
          </div>
          <input
            className="input input--bare composer__input"
            value={props.value}
            placeholder={placeholder}
            aria-label={placeholder}
            disabled={isLocked}
            role="combobox"
            aria-expanded={isPickerOpen}
            aria-controls="mention-picker"
            aria-autocomplete="list"
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onScroll={onInputScroll}
          />
        </div>
        <button
          type="button"
          className={button.className}
          disabled={!canPress}
          aria-label={button.label}
          title={button.label}
          onClick={onButtonClick}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={button.glyph} aria-hidden="true" {...glyphMotion}>
              {button.glyph}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
};

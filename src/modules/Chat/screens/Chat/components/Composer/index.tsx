import type { IComposerProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { CommandPicker, MentionPicker } from './components';
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
    iconMotion,
    placeholder,
    fieldClassName,
    isPickerOpen,
    isCommandOpen,
    commandHighlight,
    commandChip,
    commandMotion,
    onPickCommand,
    onCommandHighlight,
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
          {isCommandOpen && props.commandPicker !== null && (
            <CommandPicker
              key="commands"
              picker={props.commandPicker}
              highlighted={commandHighlight}
              onPick={onPickCommand}
              onHighlight={onCommandHighlight}
            />
          )}
        </AnimatePresence>

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

        <AnimatePresence initial={false}>
          {commandChip !== null && (
            <motion.span key="command" className="composer__command" {...commandMotion}>
              <span className="composer__command-name">/ {commandChip.name}</span>
              <AnimatePresence initial={false}>
                {commandChip.parts.map((part) => (
                  <motion.span
                    key={part.key}
                    className={part.className}
                    {...commandMotion}
                  >
                    {part.text}
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.span>
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
            autoFocus={props.isAutoFocused}
            role="combobox"
            aria-expanded={isPickerOpen || isCommandOpen}
            aria-controls={isCommandOpen ? 'command-picker' : 'mention-picker'}
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
            <motion.span key={button.icon} className="composer__icon" {...iconMotion}>
              <Icon name={button.icon} size={16} />
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
};

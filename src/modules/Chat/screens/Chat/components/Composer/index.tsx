import type { IComposerProps } from './types';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/atoms';
import { ModelPopover } from '@/components/organisms/ModelPopover';
import { MentionPicker } from './components';
import { useComposerViewModel } from './hooks';
import './styles.css';

export const Composer: React.FC<IComposerProps> = (props) => {
  const {
    canSend,
    isPickerOpen,
    highlighted,
    isModelMenuOpen,
    onSendClick,
    onPick,
    onHighlight,
    onInputChange,
    onKeyDown,
    onAgentClick,
  } = useComposerViewModel(props);
  const { t } = useTranslation();

  return (
    <div className="composer">
      <div className="composer__chips">
        <span className="composer__agent">
          <Chip dotTone="var(--pass)" hasCaret onClick={onAgentClick}>
            {props.agentLabel}
          </Chip>

          <AnimatePresence>
            {isModelMenuOpen && <ModelPopover key="model" at="composer" />}
          </AnimatePresence>
        </span>
      </div>

      <div className="composer__field">
        <AnimatePresence>
          {isPickerOpen && (
            <MentionPicker
              key="mentions"
              references={props.mentions}
              highlighted={highlighted}
              onPick={onPick}
              onHighlight={onHighlight}
            />
          )}
        </AnimatePresence>

        <input
          className="input input--bare"
          value={props.value}
          placeholder={t('CHAT.PLACEHOLDER')}
          aria-label={t('CHAT.PLACEHOLDER')}
          role="combobox"
          aria-expanded={isPickerOpen}
          aria-controls="mention-picker"
          aria-autocomplete="list"
          onChange={onInputChange}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="composer__send"
          disabled={!canSend}
          aria-label={t('CHAT.SEND')}
          onClick={onSendClick}
        >
          <span aria-hidden="true">↑</span>
        </button>
      </div>
    </div>
  );
};

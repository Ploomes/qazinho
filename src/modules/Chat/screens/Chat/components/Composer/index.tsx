import type { IComposerProps } from './types';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MentionPicker } from './components';
import { useComposerViewModel } from './hooks';
import './styles.css';

export const Composer: React.FC<IComposerProps> = (props) => {
  const {
    canSend,
    isPickerOpen,
    highlighted,
    shown,
    tabs,
    onSendClick,
    onPick,
    onHighlight,
    onTab,
    onInputChange,
    onKeyDown,
  } = useComposerViewModel(props);
  const { t } = useTranslation();

  return (
    <div className="composer">
      <div className="composer__field">
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

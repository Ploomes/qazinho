import type { IComposerProps } from './types';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/atoms';
import { ModelPopover } from '@/components/organisms/ModelPopover';
import { useComposerViewModel } from './hooks';
import './styles.css';

export const Composer: React.FC<IComposerProps> = (props) => {
  const { canSend, isModelMenuOpen, onSendClick, onKeyDown, onAgentClick } =
    useComposerViewModel(props);
  const { t } = useTranslation();

  return (
    <div className="composer">
      <div className="composer__chips">
        <Chip>{props.targetLabel}</Chip>
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
        <input
          className="input input--bare"
          value={props.value}
          placeholder={t('CHAT.PLACEHOLDER')}
          aria-label={t('CHAT.PLACEHOLDER')}
          onChange={(event) => {
            props.onChange(event.target.value);
          }}
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

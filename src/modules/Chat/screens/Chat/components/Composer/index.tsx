import type { IComposerProps } from './types';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/atoms';
import { useComposerViewModel } from './hooks';
import './styles.css';

export const Composer: React.FC<IComposerProps> = (props) => {
  const { canSend, onSendClick, onKeyDown } = useComposerViewModel(props);
  const { t } = useTranslation();

  return (
    <div className="composer">
      <div className="composer__chips">
        <Chip hasCaret>{props.targetLabel}</Chip>
        <Chip dotTone="var(--pass)" hasCaret>
          {props.agentLabel}
        </Chip>
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

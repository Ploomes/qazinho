import type { IComposerProps } from './types';
import { Chip } from '@/components/atoms';
import { useComposerViewModel } from './hooks';
import './styles.css';

export const Composer: React.FC<IComposerProps> = (props) => {
  const { canSend, onSendClick, onKeyDown } = useComposerViewModel(props);

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
          placeholder="Tell the agent what to test"
          aria-label="Tell the agent what to test"
          onChange={(event) => {
            props.onChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="composer__send"
          disabled={!canSend}
          aria-label="Send"
          onClick={onSendClick}
        >
          <span aria-hidden="true">↑</span>
        </button>
      </div>
    </div>
  );
};

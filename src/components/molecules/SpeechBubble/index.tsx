import type { ISpeechBubbleProps } from './types';
import { useSpeechBubbleViewModel } from './hooks';
import './styles.css';

export const SpeechBubble: React.FC<ISpeechBubbleProps> = (props) => {
  const { said, isStreaming, reserve, onSkip } = useSpeechBubbleViewModel(props);

  return (
    <button type="button" className="speech-bubble" aria-live="polite" onClick={onSkip}>
      <span className="speech-bubble__reserve" aria-hidden="true">
        {reserve}
      </span>
      <span className="speech-bubble__said">
        {said}
        {isStreaming && <span className="speech-bubble__caret" aria-hidden="true" />}
      </span>
    </button>
  );
};

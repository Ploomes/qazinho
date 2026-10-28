import type { ISpeechBubbleProps } from './types';
import { useSpeechBubbleViewModel } from './hooks';
import './styles.css';

/**
 * Uma fala de alguém na tela, digitada no lugar: a linha inteira guarda a forma final
 * desde o primeiro frame.
 */
export const SpeechBubble: React.FC<ISpeechBubbleProps> = (props) => {
  const { said, unsaid, isStreaming, textRef, style, onSkip } =
    useSpeechBubbleViewModel(props);

  return (
    <button
      type="button"
      className="speech-bubble"
      aria-live="polite"
      style={style}
      onClick={onSkip}
    >
      <span ref={textRef} className="speech-bubble__text">
        {said}
        {isStreaming && <span className="speech-bubble__caret" aria-hidden="true" />}
        <span className="speech-bubble__unsaid" aria-hidden="true">
          {unsaid}
        </span>
      </span>
    </button>
  );
};

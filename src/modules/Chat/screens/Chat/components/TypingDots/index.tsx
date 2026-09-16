import './styles.css';

export const TypingDots: React.FC = () => (
  <span className="typing-dots" aria-label="the agent is reading what you wrote">
    <span className="typing-dots__dot" />
    <span className="typing-dots__dot" />
    <span className="typing-dots__dot" />
  </span>
);

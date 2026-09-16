import type { IAskBlockProps } from './types';
import { Eyebrow } from '@/components/atoms';
import './styles.css';

export const AskBlock: React.FC<IAskBlockProps> = ({ message, onAnswer }) => (
  <div className="ask-block">
    <Eyebrow>the agent needs you</Eyebrow>
    <p className="ask-block__text">{message.text}</p>
    <div className="ask-block__options">
      {message.options.map((option) => (
        <button
          key={option.label}
          type="button"
          className={
            option.isPrimary
              ? 'ask-block__option ask-block__option--primary'
              : 'ask-block__option'
          }
          onClick={() => {
            onAnswer(option.reply);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
    <span className="ask-block__meta">the run is holding · {message.holdingFor}</span>
  </div>
);

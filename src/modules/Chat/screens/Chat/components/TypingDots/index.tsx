import { useTranslation } from 'react-i18next';
import './styles.css';

export const TypingDots: React.FC = () => {
  const { t } = useTranslation();

  return (
    <span className="typing-dots" aria-label={t('CHAT.TYPING')}>
      <span className="typing-dots__dot" />
      <span className="typing-dots__dot" />
      <span className="typing-dots__dot" />
    </span>
  );
};

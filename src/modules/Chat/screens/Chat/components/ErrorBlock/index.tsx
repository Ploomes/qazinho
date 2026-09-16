import type { IErrorBlockProps } from './types';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/components/atoms';
import './styles.css';

/** A broken tool is never a test result: this block can never look like a verdict. */
export const ErrorBlock: React.FC<IErrorBlockProps> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="error-block">
      <Eyebrow>{t('CHAT.ERROR_KICKER')}</Eyebrow>
      <p className="error-block__text">{message.text}</p>
      {message.fix !== null && <span className="error-block__fix">{message.fix}</span>}
    </div>
  );
};

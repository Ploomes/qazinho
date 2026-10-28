import type { IErrorBlockProps } from './types';
import { useTranslation } from 'react-i18next';
import { Eyebrow, Intern } from '@/shared/components/atoms';
import './styles.css';

/**
 * Uma ferramenta quebrada nunca é resultado de teste: este bloco nunca pode parecer um
 * veredito.
 */
export const ErrorBlock: React.FC<IErrorBlockProps> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="error-block">
      <Intern mood="broken" size={44} />
      <div className="error-block__body">
        <Eyebrow>{t('CHAT.ERROR_KICKER')}</Eyebrow>
        <p className="error-block__text">{message.text}</p>
        {message.fix !== null && <span className="error-block__fix">{message.fix}</span>}
      </div>
    </div>
  );
};

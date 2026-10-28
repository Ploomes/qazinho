import type { IExpectedGotProps } from './types';
import { useTranslation } from 'react-i18next';
import './styles.css';

/** O que o passo esperava e o que veio, uma linha cada, rótulo ao lado das palavras. */
export const ExpectedGot: React.FC<IExpectedGotProps> = ({
  expected,
  got,
  isBug = false,
}) => {
  const { t } = useTranslation();

  return (
    <dl className={isBug ? 'expected-got expected-got--bug' : 'expected-got'}>
      <div className="expected-got__row">
        <dt className="expected-got__label">{t('COMMON.EXPECTED')}</dt>
        <dd className="expected-got__value">{expected}</dd>
      </div>
      <div className="expected-got__row">
        <dt className="expected-got__label">{t('COMMON.GOT')}</dt>
        <dd className="expected-got__value">{got}</dd>
      </div>
    </dl>
  );
};

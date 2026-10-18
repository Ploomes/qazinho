import type { IExpectedGotProps } from './types';
import { useTranslation } from 'react-i18next';
import './styles.css';

export const ExpectedGot: React.FC<IExpectedGotProps> = ({
  expected,
  got,
  isBug = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className={isBug ? 'expected-got expected-got--bug' : 'expected-got'}>
      <div>
        <span className="expected-got__label">{t('COMMON.EXPECTED')}</span>
        <p className="expected-got__value">{expected}</p>
      </div>
      <div>
        <span className="expected-got__label">{t('COMMON.GOT')}</span>
        <p className="expected-got__value">{got}</p>
      </div>
    </div>
  );
};

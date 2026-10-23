import type { IExpectedGotProps } from './types';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/components/atoms';
import './styles.css';

/** What the step expected beside what came, each in a box of its own: the expectation plain, what came marked as the failure when it is a bug. */
export const ExpectedGot: React.FC<IExpectedGotProps> = ({
  expected,
  got,
  isBug = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className={isBug ? 'expected-got expected-got--bug' : 'expected-got'}>
      <div className="expected-got__item expected-got__item--expected">
        <span className="expected-got__label">
          <Icon name="passed" />
          {t('COMMON.EXPECTED')}
        </span>
        <p className="expected-got__value">{expected}</p>
      </div>
      <div className="expected-got__item expected-got__item--got">
        <span className="expected-got__label">
          <Icon name="failed" />
          {t('COMMON.GOT')}
        </span>
        <p className="expected-got__value">{got}</p>
      </div>
    </div>
  );
};

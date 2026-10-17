import type { IExpectedGotProps } from './types';
import './styles.css';

export const ExpectedGot: React.FC<IExpectedGotProps> = ({
  expected,
  got,
  isBug = false,
}) => (
  <div className={isBug ? 'expected-got expected-got--bug' : 'expected-got'}>
    <div>
      <span className="expected-got__label">expected</span>
      <p className="expected-got__value">{expected}</p>
    </div>
    <div>
      <span className="expected-got__label">got</span>
      <p className="expected-got__value">{got}</p>
    </div>
  </div>
);

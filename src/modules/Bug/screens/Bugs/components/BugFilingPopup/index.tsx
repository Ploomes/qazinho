import type { IBugFilingPopupProps } from './types';
import { StepsPopup } from '@/shared/components/organisms';
import { useBugFilingPopupViewModel } from './hooks';

/** Um bug a caminho do tracker do QA, passo a passo, e a issue em que virou. */
export const BugFilingPopup: React.FC<IBugFilingPopupProps> = (props) => {
  const { logo, name, ...popup } = useBugFilingPopupViewModel(props);

  return <StepsPopup badge={<img src={logo} alt={name} />} {...popup} />;
};

import type { IBugFilingPopupProps } from './types';
import { StepsPopup } from '@/shared/components/organisms';
import { useBugFilingPopupViewModel } from './hooks';

/** A bug on its way to the QA's tracker, step by step, and the issue it became. */
export const BugFilingPopup: React.FC<IBugFilingPopupProps> = (props) => {
  const { logo, name, ...popup } = useBugFilingPopupViewModel(props);

  return <StepsPopup badge={<img src={logo} alt={name} />} {...popup} />;
};

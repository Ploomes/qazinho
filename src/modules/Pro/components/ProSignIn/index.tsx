import type { IProSignInProps } from './types';
import { Intern } from '@/shared/components/atoms';
import { StepsPopup } from '@/shared/components/organisms';
import { useProSignInViewModel } from './hooks';

/**
 * This computer signing in to QAzinho Pro, step by step, with the code to confirm in the
 * browser.
 */
export const ProSignIn: React.FC<IProSignInProps> = (props) => {
  const popup = useProSignInViewModel(props);

  return <StepsPopup badge={<Intern mood="thinking" size={34} isStill />} {...popup} />;
};

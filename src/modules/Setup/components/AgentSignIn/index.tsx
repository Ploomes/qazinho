import type { IAgentSignInProps } from './types';
import { Intern } from '@/shared/components/atoms';
import { StepsPopup } from '@/shared/components/organisms';
import { useAgentSignInViewModel } from './hooks';

/**
 * The QA's agent signing in to their account through its own page, step by step; the
 * sign-in itself is the QA's.
 */
export const AgentSignIn: React.FC<IAgentSignInProps> = (props) => {
  const popup = useAgentSignInViewModel(props);

  return <StepsPopup badge={<Intern mood="thinking" size={34} isStill />} {...popup} />;
};

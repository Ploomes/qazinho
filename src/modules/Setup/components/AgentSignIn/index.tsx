import type { IAgentSignInProps } from './types';
import { Intern } from '@/shared/components/atoms';
import { StepsPopup } from '@/shared/components/organisms';
import { useAgentSignInViewModel } from './hooks';

/**
 * O agente do QA entrando na conta dele pela própria página, passo a passo; o login em si
 * é do QA.
 */
export const AgentSignIn: React.FC<IAgentSignInProps> = (props) => {
  const popup = useAgentSignInViewModel(props);

  return <StepsPopup badge={<Intern mood="thinking" size={34} isStill />} {...popup} />;
};

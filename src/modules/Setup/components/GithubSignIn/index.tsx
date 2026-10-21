import type { IGithubSignInProps } from './types';
import { Intern } from '@/shared/components/atoms';
import { StepsPopup } from '@/shared/components/organisms';
import { useGithubSignInViewModel } from './hooks';

/** GitHub connecting through the QA's own GitHub CLI: gh's device flow, step by step, with the code to type at GitHub. */
export const GithubSignIn: React.FC<IGithubSignInProps> = (props) => {
  const popup = useGithubSignInViewModel(props);

  return <StepsPopup badge={<Intern mood="thinking" size={34} isStill />} {...popup} />;
};

import type { IGithubSignInProps } from './types';
import { Intern } from '@/shared/components/atoms';
import { StepsPopup } from '@/shared/components/organisms';
import { useGithubSignInViewModel } from './hooks';

/**
 * O GitHub conectando pela GitHub CLI do próprio QA: o device flow do gh, passo a passo,
 * com o código a digitar no GitHub.
 */
export const GithubSignIn: React.FC<IGithubSignInProps> = (props) => {
  const popup = useGithubSignInViewModel(props);

  return <StepsPopup badge={<Intern mood="thinking" size={34} isStill />} {...popup} />;
};

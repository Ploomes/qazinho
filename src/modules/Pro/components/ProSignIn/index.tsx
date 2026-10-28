import type { IProSignInProps } from './types';
import { Intern } from '@/shared/components/atoms';
import { StepsPopup } from '@/shared/components/organisms';
import { useProSignInViewModel } from './hooks';

/**
 * Este computador entrando no QAzinho Pro, passo a passo, com o código a confirmar no
 * navegador.
 */
export const ProSignIn: React.FC<IProSignInProps> = (props) => {
  const popup = useProSignInViewModel(props);

  return <StepsPopup badge={<Intern mood="thinking" size={34} isStill />} {...popup} />;
};

import type { IMcpSignInProps } from './types';
import { StepsPopup } from '@/shared/components/organisms';
import { useMcpSignInViewModel } from './hooks';

/**
 * Os passos que o QAzinho dá para fazer o agente do QA entrar num servidor MCP, conforme
 * acontecem; só o último é do QA.
 */
export const McpSignIn: React.FC<IMcpSignInProps> = (props) => {
  const popup = useMcpSignInViewModel(props);

  return (
    <StepsPopup
      badge={<img src={props.server.logo} alt={props.server.name} />}
      {...popup}
    />
  );
};

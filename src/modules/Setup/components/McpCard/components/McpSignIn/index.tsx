import type { IMcpSignInProps } from './types';
import { StepsPopup } from '@/shared/components/organisms';
import { useMcpSignInViewModel } from './hooks';

/** The steps QAzinho takes to sign the QA's agent in to an MCP server, as they happen; only the last one is the QA's. */
export const McpSignIn: React.FC<IMcpSignInProps> = (props) => {
  const popup = useMcpSignInViewModel(props);

  return (
    <StepsPopup
      badge={<img src={props.server.logo} alt={props.server.name} />}
      {...popup}
    />
  );
};

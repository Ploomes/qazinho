/**
 * Um agente que o QAzinho achou nesta máquina, e se está logado; null quando o agente não
 * quis dizer.
 */
export interface IDetectedAgent {
  id: string;
  name: string;
  command: string;
  isFound: boolean;
  path: string | null;
  defaultModel: string | null;
  isSignedIn: boolean | null;
}

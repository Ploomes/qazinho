/** O nome do workspace no cabeçalho, renomeado no lugar. */
export interface IWorkspaceNameProps {
  name: string;
  onRename: (name: string) => void;
}

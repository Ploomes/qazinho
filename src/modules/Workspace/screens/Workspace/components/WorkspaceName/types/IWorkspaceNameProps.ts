/** The workspace's name in its header, renamed in place. */
export interface IWorkspaceNameProps {
  name: string;
  onRename: (name: string) => void;
}

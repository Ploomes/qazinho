/** A linha Bugs de um projeto na barra lateral, com os abertos ainda não enviados. */
export interface ISidebarBugsRow {
  kind: 'bugs';
  id: string;
  projectId: string;
  count: string | null;
  isSelected: boolean;
}

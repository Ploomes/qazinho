/** O nome do plano na barra de título, renomeado no lugar. */
export interface IPlanNameProps {
  name: string;
  onRename: (name: string) => void;
}

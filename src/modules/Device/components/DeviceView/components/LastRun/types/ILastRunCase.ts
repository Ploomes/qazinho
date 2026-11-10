/** Um caso que não passou na última run, e o que abrir dele: o bug, ou a run em Runs. */
export interface ILastRunCase {
  key: string;
  id: string;
  title: string;
  linkLabel: string;
  onOpen: () => void;
}

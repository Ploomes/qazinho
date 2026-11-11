/** Uma tecla apertada na janela, com os modificadores, como o Electron a descreve. */
export interface IKeyPress {
  type: string;
  key: string;
  control: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

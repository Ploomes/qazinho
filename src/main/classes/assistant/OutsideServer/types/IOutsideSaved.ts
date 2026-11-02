/** A porta dos agentes de fora em disco: se está ligada, a porta e o token. */
export interface IOutsideSaved {
  isOn: boolean;
  port: number;
  token: string;
}

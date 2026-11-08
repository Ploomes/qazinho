/** Uma tela aberta numa run: onde está, de que conta é, e se o agente está nela. */
export interface IRunScreen {
  id: number;
  url: string;
  isAgent: boolean;
  account: number;
  streamUrl: string | null;
}

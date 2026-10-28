/**
 * Uma run em andamento na suíte de um projeto: o id, e os testes rodando agora, cada um
 * com o passo em que está.
 */
export interface ISuiteLive {
  runId: string;
  going: Record<string, string | null>;
}

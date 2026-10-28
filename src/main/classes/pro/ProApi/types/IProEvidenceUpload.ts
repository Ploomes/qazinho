/**
 * Onde a plataforma deixa esta máquina pôr um arquivo: a chave pela qual será conhecido,
 * o endereço, e os cabeçalhos que o upload precisa levar.
 */
export interface IProEvidenceUpload {
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
}

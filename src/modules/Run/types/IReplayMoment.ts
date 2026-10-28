/**
 * Onde um momento do vídeo cai: o caso e o passo que mostra, ou o intervalo depois de um
 * caso enquanto o app abre de novo.
 */
export interface IReplayMoment {
  chapterIndex: number;
  stepIndex: number;
  isBetween: boolean;
}

/**
 * Os bytes que o QAzinho guarda neste computador: os vídeos e telas das runs, os apps que
 * construiu, o resto, e tudo junto.
 */
export interface IStorageUsage {
  videos: number;
  screens: number;
  builds: number;
  other: number;
  total: number;
}

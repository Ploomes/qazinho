/**
 * A pasta de dados do QAzinho, onde ele guarda os apps que construiu, e o relógio com que
 * envelhece os vídeos.
 */
export interface IStorageKeeper {
  dataRoot: string;
  buildsRoot: string;
  now: () => Date;
}

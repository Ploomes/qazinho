/** QAzinho's data folder, where it keeps the apps it built, and the clock it ages videos by. */
export interface IStorageKeeper {
  dataRoot: string;
  buildsRoot: string;
  now: () => Date;
}

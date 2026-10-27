/**
 * The bytes QAzinho keeps on this computer: the runs' videos and screens, the apps it
 * built, the rest, and all of it.
 */
export interface IStorageUsage {
  videos: number;
  screens: number;
  builds: number;
  other: number;
  total: number;
}

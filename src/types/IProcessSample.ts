/** One process gocrash is responsible for, as the host reported it. */
export interface IProcessSample {
  pid: number;
  name: string;
  cpu: number;
  ramMb: number;
}

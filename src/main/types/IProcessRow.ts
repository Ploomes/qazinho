/** One row of the host-wide process sweep, before it is charged to anything. */
export interface IProcessRow {
  pid: number;
  parentPid: number;
  cpu: number;
  ramMb: number;
  name: string;
  command: string;
}

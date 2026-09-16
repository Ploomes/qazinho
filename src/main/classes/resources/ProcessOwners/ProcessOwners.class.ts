import type { IProcessClaim } from './types';

/** Who a process belongs to. Only the main process knows, because only it starts them. */
export class ProcessOwners {
  private readonly claims = new Map<number, IProcessClaim>();

  public claim(props: IProcessClaim & { pid: number }): void {
    this.claims.set(props.pid, { workspaceId: props.workspaceId, kind: props.kind });
  }

  public release(pid: number): void {
    this.claims.delete(pid);
  }

  public all(): Map<number, IProcessClaim> {
    return new Map(this.claims);
  }
}

import type { IProcessSample } from './IProcessSample';

/** O que a máquina está pagando pelo QAzinho agora, o app incluído. */
export interface IResourceSnapshot {
  cpu: number;
  ramMb: number;
  ramCeilingGb: number;
  processes: IProcessSample[];
}

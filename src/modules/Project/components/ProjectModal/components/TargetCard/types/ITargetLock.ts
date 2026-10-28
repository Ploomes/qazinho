/**
 * Por que uma parte de um projeto ainda não pode ser usada nesta máquina, e como
 * consertar: um guia a seguir, ou uma coisa que o QAzinho faz.
 */
export interface ITargetLock {
  reason: string;
  setUp:
    | { label: string; guide: string; link: { label: string; url: string } }
    | { label: string; onSetUp: () => void }
    | null;
}

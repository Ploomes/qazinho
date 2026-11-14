import type {
  CodeRead,
  DeviceInput,
  ExportOutcome,
  IDevelopedAsk,
  IDevelopedPlan,
  IExportCode,
  IManualMark,
  INetworkEntry,
  IRemovedVideo,
  IRunAlert,
  IRunEvent,
  IRunInFlight,
  IRunRef,
  IStartRun,
  IViewport,
  QaReply,
  SaveOutcome,
} from '@/shared/types';

/** O único que chama o lado das runs da bridge. */
export class Run {
  public static start(run: IStartRun): void {
    void window.qazinho?.startRun(run);
  }

  public static async exportCode(request: IExportCode): Promise<ExportOutcome> {
    return (
      (await window.qazinho?.exportCode(request)) ?? { kind: 'failed', reason: 'write' }
    );
  }

  public static async readCode(request: IExportCode): Promise<CodeRead> {
    return (await window.qazinho?.readCode(request)) ?? { kind: 'nothing', missing: [] };
  }

  public static async developed(ask: IDevelopedAsk): Promise<IDevelopedPlan> {
    return (await window.qazinho?.developedCases(ask)) ?? { caseIds: [], files: [] };
  }

  public static talk(props: { workspaceId: string; text: string }): void {
    void window.qazinho?.talkRun(props);
  }

  public static setPaused(props: { workspaceId: string; isPaused: boolean }): void {
    void window.qazinho?.pauseRun(props);
  }

  public static stop(workspaceId: string): void {
    void window.qazinho?.stopRun(workspaceId);
  }

  public static answer(props: {
    workspaceId: string;
    questionId: string;
    reply: QaReply;
  }): void {
    void window.qazinho?.answerRun(props);
  }

  public static touch(props: { workspaceId: string; input: DeviceInput }): void {
    void window.qazinho?.touchRun(props).catch(() => undefined);
  }

  public static mark(mark: IManualMark): void {
    void window.qazinho?.markRun(mark);
  }

  public static async typeVariable(props: {
    workspaceId: string;
    name: string;
  }): Promise<boolean> {
    return (await window.qazinho?.typeRunVariable(props)) ?? false;
  }

  public static endManual(workspaceId: string): void {
    void window.qazinho?.endManual(workspaceId);
  }

  public static resize(props: { workspaceId: string; viewport: IViewport }): void {
    void window.qazinho?.resizeDevice(props);
  }

  public static focus(props: { workspaceId: string; isFocused: boolean }): void {
    void window.qazinho?.focusDevice(props);
  }

  public static async inFlight(): Promise<IRunInFlight[]> {
    return (await window.qazinho?.runsInFlight()) ?? [];
  }

  public static onEvent(listener: (event: IRunEvent) => void): () => void {
    return window.qazinho?.onRunEvent(listener) ?? (() => undefined);
  }

  public static async replayUrl(run: IRunRef): Promise<string | null> {
    return (await window.qazinho?.replayUrl(run)) ?? null;
  }

  public static async network(run: IRunRef): Promise<INetworkEntry[] | null> {
    return (await window.qazinho?.runNetwork(run)) ?? null;
  }

  /**
   * Quando, e depois de quantos dias, o QAzinho soltou o vídeo de uma run; null para um
   * que ele nunca soltou.
   */
  public static async removedVideo(run: IRunRef): Promise<IRemovedVideo | null> {
    return (await window.qazinho?.removedVideo(run)) ?? null;
  }

  public static async replayVideo(run: IRunRef): Promise<Uint8Array | null> {
    return (await window.qazinho?.replayVideo(run)) ?? null;
  }

  public static async saveVideo(props: {
    name: string;
    data: Uint8Array;
  }): Promise<SaveOutcome> {
    return (await window.qazinho?.saveVideo(props)) ?? 'failed';
  }

  public static async saveReplay(
    props: IRunRef & { name: string },
  ): Promise<SaveOutcome> {
    return (await window.qazinho?.saveReplay(props)) ?? 'failed';
  }

  public static alert(notice: IRunAlert): void {
    window.qazinho?.alertRun(notice);
  }

  public static onOpen(listener: (run: IRunRef) => void): () => void {
    return window.qazinho?.onOpenRun(listener) ?? (() => undefined);
  }
}

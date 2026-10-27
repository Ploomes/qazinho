/**
 * The only caller of the diagnostics side of the bridge: the app's own log, kept on this
 * machine.
 */
export class Diagnostics {
  public static async openLogs(): Promise<void> {
    await window.qazinho?.openLogs();
  }

  public static async copy(): Promise<boolean> {
    return (await window.qazinho?.copyDiagnostics()) ?? false;
  }
}

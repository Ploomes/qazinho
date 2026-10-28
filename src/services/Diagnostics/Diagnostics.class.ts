/**
 * O único que chama o lado do diagnóstico da bridge: o log do próprio app, guardado nesta
 * máquina.
 */
export class Diagnostics {
  public static async openLogs(): Promise<void> {
    await window.qazinho?.openLogs();
  }

  public static async copy(): Promise<boolean> {
    return (await window.qazinho?.copyDiagnostics()) ?? false;
  }
}

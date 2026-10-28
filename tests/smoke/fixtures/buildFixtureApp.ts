import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const SOURCE = fileURLToPath(new URL('./ios', import.meta.url));

/**
 * Constrói o app contador de visitas de fixtures/ios num `.app` de simulador, do fonte,
 * com o Xcode que o QA já tem: clang para o simulador, depois uma assinatura ad-hoc, que
 * um simulador em Apple silicon pede. Ele mostra "Visits: N" e um botão "Save visit",
 * como o do Android. Devolve null quando o Xcode falta, para a suíte dizer isso em vez de
 * falhar.
 */
export async function buildFixtureApp(): Promise<string | null> {
  const app = join(await mkdtemp(join(tmpdir(), 'qazinho-app-')), 'Fixture.app');

  try {
    await mkdir(app);
    await copyFile(join(SOURCE, 'Info.plist'), join(app, 'Info.plist'));
    await run('xcrun', [
      '-sdk',
      'iphonesimulator',
      'clang',
      '-arch',
      'arm64',
      '-mios-simulator-version-min=15.0',
      '-fobjc-arc',
      '-framework',
      'UIKit',
      '-framework',
      'Foundation',
      join(SOURCE, 'main.m'),
      '-o',
      join(app, 'Fixture'),
    ]);
    await run('codesign', ['-s', '-', '--force', app]);

    return app;
  } catch (reason) {
    console.log(`The fixture app did not build: ${String(reason)}`);

    return null;
  }
}

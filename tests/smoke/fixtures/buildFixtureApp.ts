import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const SOURCE = fileURLToPath(new URL('./ios', import.meta.url));

/**
 * Builds the visit counter app in fixtures/ios into a simulator `.app`, from source, with the
 * Xcode the QA already has: clang for the simulator, then an ad-hoc signature, which a simulator
 * on Apple silicon asks for. It shows "Visits: N" and a "Save visit" button, like the Android
 * one. Returns null when Xcode is missing, so the suite can say so instead of failing.
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

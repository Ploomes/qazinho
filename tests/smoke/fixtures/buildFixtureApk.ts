import { execFile } from 'node:child_process';
import { access, copyFile, mkdir, mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const SOURCE = fileURLToPath(new URL('./android', import.meta.url));

/** A pasta mais nova de um diretório do SDK: build-tools/36.0.0, platforms/android-36. */
async function newest(folder: string): Promise<string | null> {
  const names = await readdir(folder).catch(() => []);
  const sorted = names
    .filter((name) => /\d/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return sorted.length === 0 ? null : join(folder, sorted.at(-1) ?? '');
}

/** O JDK que o Android Studio traz, senão o javac que estiver no PATH. */
async function jdkBin(): Promise<string> {
  const studio = '/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin';

  return access(join(studio, 'javac')).then(
    () => studio,
    () => '',
  );
}

/**
 * Constrói o app contador de visitas de fixtures/android num apk assinado, do fonte, com
 * o SDK que o QA já tem: javac, d8, aapt2, zipalign e apksigner. Ele mostra "Visits: N" e
 * um botão "Save visit" que soma um e o guarda, para um teste ver se os dados do app
 * sobreviveram. Devolve null quando falta uma ferramenta, para a suíte dizer isso em vez
 * de falhar.
 */
export async function buildFixtureApk(sdkRoot: string): Promise<string | null> {
  const tools = await newest(join(sdkRoot, 'build-tools'));
  const platform = await newest(join(sdkRoot, 'platforms'));

  if (tools === null || platform === null) return null;

  const jdk = await jdkBin();
  const javac = jdk === '' ? 'javac' : join(jdk, 'javac');
  const keytool = jdk === '' ? 'keytool' : join(jdk, 'keytool');
  const androidJar = join(platform, 'android.jar');
  const work = await mkdtemp(join(tmpdir(), 'qazinho-apk-'));
  const classes = join(work, 'classes');
  const dex = join(work, 'dex');

  try {
    await mkdir(classes);
    await mkdir(dex);
    await run(javac, [
      '-source',
      '8',
      '-target',
      '8',
      '-nowarn',
      '-bootclasspath',
      androidJar,
      '-d',
      classes,
      join(SOURCE, 'app', 'qazinho', 'fixture', 'Main.java'),
    ]);

    const compiled = join(classes, 'app', 'qazinho', 'fixture');
    const classFiles = (await readdir(compiled)).map((name) => join(compiled, name));

    await run(join(tools, 'd8'), [
      '--min-api',
      '24',
      '--lib',
      androidJar,
      '--output',
      dex,
      ...classFiles,
    ]);
    await run(join(tools, 'aapt2'), [
      'link',
      '-o',
      join(work, 'base.apk'),
      '--manifest',
      join(SOURCE, 'AndroidManifest.xml'),
      '-I',
      androidJar,
      '--min-sdk-version',
      '24',
      '--target-sdk-version',
      '34',
    ]);
    await copyFile(join(dex, 'classes.dex'), join(work, 'classes.dex'));
    await run('zip', ['-q', join(work, 'base.apk'), 'classes.dex'], { cwd: work });
    await run(join(tools, 'zipalign'), [
      '-f',
      '4',
      join(work, 'base.apk'),
      join(work, 'aligned.apk'),
    ]);
    const keystore = join(tmpdir(), 'qazinho-fixture-debug.keystore');

    await access(keystore).catch(() =>
      run(keytool, [
        '-genkeypair',
        '-keystore',
        keystore,
        '-storepass',
        'android',
        '-keypass',
        'android',
        '-alias',
        'qa',
        '-keyalg',
        'RSA',
        '-keysize',
        '2048',
        '-validity',
        '10000',
        '-dname',
        'CN=QAzinho',
      ]),
    );
    await run(join(tools, 'apksigner'), [
      'sign',
      '--ks',
      keystore,
      '--ks-pass',
      'pass:android',
      '--key-pass',
      'pass:android',
      '--out',
      join(work, 'fixture.apk'),
      join(work, 'aligned.apk'),
    ]);

    return join(work, 'fixture.apk');
  } catch (reason) {
    console.log(`The fixture apk did not build: ${String(reason)}`);

    return null;
  }
}

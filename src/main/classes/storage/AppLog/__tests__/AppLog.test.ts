import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AppLog } from '@/main/classes/storage/AppLog';

describe('AppLog', () => {
  it('writes each line in the order it came, and reads the last ones back', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'qazinho-log-'));
    const log = new AppLog({ folder, home: '/Users/ana' });

    log.write({ level: 'info', scope: 'app', message: 'QAzinho 0.1.0 on darwin' });
    log.write({ level: 'error', scope: 'page', message: 'Boom at /Users/ana/x' });

    const lines = await log.tail(10);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('INFO  [app] QAzinho 0.1.0 on darwin');
    expect(lines[1]).toContain('ERROR [page] Boom at ~/x');
  });

  /** A QA who keeps the app open for weeks must not end with a log the size of a video. */
  it('rolls the file over once it grows past its size, keeping the lines before it', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'qazinho-log-'));

    await writeFile(join(folder, 'qazinho.log'), `${'x'.repeat(2 * 1024 * 1024 + 10)}\n`);

    const log = new AppLog({ folder, home: '/Users/ana' });

    log.write({ level: 'warn', scope: 'run', message: 'after the roll' });
    await log.tail(1);

    expect(await readFile(join(folder, 'qazinho.log'), 'utf8')).toContain(
      'after the roll',
    );
    expect(
      (await readFile(join(folder, 'qazinho.1.log'), 'utf8')).length,
    ).toBeGreaterThan(2 * 1024 * 1024);
  });

  it('never throws when the folder cannot be written', async () => {
    const log = new AppLog({ folder: '/dev/null/nope', home: '/Users/ana' });

    log.write({ level: 'error', scope: 'app', message: 'lost' });

    expect(await log.tail(5)).toEqual([]);
  });
});

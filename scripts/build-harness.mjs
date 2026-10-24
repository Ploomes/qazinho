import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const folder = fileURLToPath(new URL('../packages/qazinho-harness', import.meta.url));

if (!existsSync(join(folder, 'package.json'))) {
  process.stderr.write(
    'The harness submodule is missing: run `git submodule update --init --recursive`.\n',
  );
  process.exit(1);
}

for (const args of [['ci'], ['run', 'build']]) {
  const { status } = spawnSync('npm', args, {
    cwd: folder,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (status !== 0) process.exit(status ?? 1);
}

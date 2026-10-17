import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const dataDir = join(tmpdir(), 'qazinho-dev-reset');

rmSync(dataDir, { recursive: true, force: true });

const dev = spawn('electron-vite', ['dev', '--', `--user-data-dir=${dataDir}`], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

dev.on('exit', (code) => process.exit(code ?? 0));

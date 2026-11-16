import type { IUsageRecord } from '@/shared/types';
import { appendFile, readFile, rename, writeFile } from 'node:fs/promises';
import { USAGE_LEDGER } from './constants';
import { usageRecordsOf } from './library';

/**
 * O que as chamadas do QAzinho ao agente do QA gastaram, guardado neste computador, uma
 * linha por chamada e modelo, por um ano.
 */
export class UsageLedger {
  private readonly file: string;
  private writing: Promise<void> = Promise.resolve();

  public constructor(props: { file: string }) {
    this.file = props.file;
  }

  /** Guarda o que uma chamada gastou, depois do que já está guardado. */
  public add(records: IUsageRecord[]): Promise<void> {
    if (records.length === 0) return this.writing;

    const text = `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;

    this.writing = this.writing
      .then(() => appendFile(this.file, text))
      .catch(() => undefined);

    return this.writing;
  }

  /** O que foi gasto desde um momento, na ordem em que foi gasto. */
  public async read(sinceMs: number): Promise<IUsageRecord[]> {
    await this.writing;

    const text = await readFile(this.file, 'utf8').catch(() => '');

    return usageRecordsOf(text).filter((record) => record.at >= sinceMs);
  }

  /** Solta o que passou de um ano, escrevendo o arquivo inteiro de novo. */
  public prune(now: number): Promise<void> {
    this.writing = this.writing
      .then(async () => {
        const text = await readFile(this.file, 'utf8').catch(() => null);

        if (text === null) return;

        const since = now - USAGE_LEDGER.keepDays * USAGE_LEDGER.dayMs;
        const kept = usageRecordsOf(text).filter((record) => record.at >= since);
        const temp = `${this.file}.tmp`;

        await writeFile(
          temp,
          kept.map((record) => `${JSON.stringify(record)}\n`).join(''),
        );
        await rename(temp, this.file);
      })
      .catch(() => undefined);

    return this.writing;
  }
}

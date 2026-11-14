import type { IExampleShopProps } from './types';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { writeAtomically } from '@/main/library';
import { EXAMPLE_SHOP } from './constants';
import { savedPortOf, shopAnswerOf } from './library';

/**
 * Uma loja pequena servida em loopback, com dois bugs de propósito, para quem não tem um
 * app ainda conhecer o QAzinho; volta sempre ao mesmo endereço.
 */
export class ExampleShop {
  private readonly file: string;
  private server: Server | null = null;
  private port = 0;

  public constructor(props: IExampleShopProps) {
    this.file = props.file;
  }

  /** Sobe a loja de novo, se ela já subiu uma vez, para os projetos dela abrirem. */
  public async resume(): Promise<void> {
    const saved = savedPortOf(await readFile(this.file, 'utf8').catch(() => ''));

    if (saved !== null) await this.listen(saved);
  }

  /** O endereço da loja no idioma do QA, subindo-a na porta de sempre. */
  public async address(language: string): Promise<string> {
    if (this.server === null) {
      const saved = savedPortOf(await readFile(this.file, 'utf8').catch(() => ''));

      await this.listen(saved ?? EXAMPLE_SHOP.port);
    }

    return `http://${EXAMPLE_SHOP.host}:${String(this.port)}/?lang=${language === 'en' ? 'en' : 'pt'}`;
  }

  public stop(): void {
    this.server?.close();
    this.server = null;
  }

  private async listen(port: number): Promise<void> {
    const wanted = this.serverOf();
    const isOpen = await new Promise<boolean>((done) => {
      wanted.once('error', () => {
        done(false);
      });
      wanted.listen(port, EXAMPLE_SHOP.host, () => {
        done(true);
      });
    });
    const server = isOpen ? wanted : this.serverOf();

    if (!isOpen)
      await new Promise<void>((done) => {
        server.listen(0, EXAMPLE_SHOP.host, done);
      });

    this.server = server;
    this.port = (server.address() as AddressInfo).port;
    await writeAtomically({
      file: this.file,
      data: JSON.stringify({ port: this.port }),
    }).catch(() => undefined);
  }

  private serverOf(): Server {
    return createServer((request, response) => {
      const url = new URL(request.url ?? '/', `http://${EXAMPLE_SHOP.host}`);
      const answer = shopAnswerOf({ path: url.pathname, query: url.searchParams });

      response.writeHead(answer.status, {
        'content-type': answer.type,
        'cache-control': 'no-store',
      });
      response.end(answer.body);
    });
  }
}

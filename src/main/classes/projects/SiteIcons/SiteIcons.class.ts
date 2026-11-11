import type { ISiteIconEntry, ISiteIconsProps, SiteFetcher } from './types';
import { readFile } from 'node:fs/promises';
import { writeAtomically } from '@/main/library';
import { SITE_ICONS } from './constants';
import {
  iconDataUrlOf,
  iconLinksIn,
  iconTypeOf,
  keptIconsOf,
  siteOriginOf,
} from './library';

/**
 * O ícone do site de cada projeto web, buscado na página dele e guardado por origem num
 * arquivo, para a barra lateral mostrar o app pelo ícone dele.
 */
export class SiteIcons {
  private readonly fetcher: SiteFetcher;
  private readonly file: string;
  private readonly now: () => number;
  private kept: Record<string, ISiteIconEntry> | null = null;
  private readonly asking = new Map<string, Promise<string | null>>();

  constructor(props: ISiteIconsProps) {
    this.fetcher = props.fetcher;
    this.file = props.file;
    this.now = props.now;
  }

  /**
   * O ícone do site de um endereço como data URL, ou null quando ele não tem um ou não é
   * um site; busca de novo só depois de um tempo, e uma vez por origem de cada vez.
   */
  public async of(address: string): Promise<string | null> {
    const origin = siteOriginOf(address);

    if (origin === null) return null;

    const kept = (await this.read())[origin];

    if (kept !== undefined && this.isFresh(kept)) return kept.icon;

    const asked = this.asking.get(origin) ?? this.look({ origin, address, kept });

    this.asking.set(origin, asked);

    try {
      return await asked;
    } finally {
      this.asking.delete(origin);
    }
  }

  private isFresh(entry: ISiteIconEntry): boolean {
    const keptMs = entry.icon === null ? SITE_ICONS.missedMs : SITE_ICONS.keptMs;

    return this.now() - entry.at < keptMs;
  }

  private async look(props: {
    origin: string;
    address: string;
    kept: ISiteIconEntry | undefined;
  }): Promise<string | null> {
    const found = await this.find(props.address);
    const icon = found ?? props.kept?.icon ?? null;

    await this.keep({ origin: props.origin, entry: { icon, at: this.now() } });

    return icon;
  }

  private async find(address: string): Promise<string | null> {
    const html = await this.pageOf(address);

    for (const url of iconLinksIn({ html, page: address }).slice(0, SITE_ICONS.tries)) {
      const icon = await this.iconAt(url);

      if (icon !== null) return icon;
    }

    return null;
  }

  private async pageOf(address: string): Promise<string> {
    try {
      const answer = await this.fetcher(address, {
        signal: AbortSignal.timeout(SITE_ICONS.waitMs),
        headers: { accept: 'text/html' },
      });

      return answer.ok ? (await answer.text()).slice(0, SITE_ICONS.pageChars) : '';
    } catch {
      return '';
    }
  }

  private async iconAt(url: string): Promise<string | null> {
    try {
      const answer = await this.fetcher(url, {
        signal: AbortSignal.timeout(SITE_ICONS.waitMs),
        headers: { accept: 'image/*' },
      });
      const type = answer.ok
        ? iconTypeOf({ contentType: answer.headers.get('content-type'), url })
        : null;

      if (type === null) return null;

      const bytes = new Uint8Array(await answer.arrayBuffer());

      return bytes.length === 0 || bytes.length > SITE_ICONS.iconBytes
        ? null
        : iconDataUrlOf({ bytes, type });
    } catch {
      return null;
    }
  }

  private async read(): Promise<Record<string, ISiteIconEntry>> {
    if (this.kept !== null) return this.kept;

    try {
      this.kept = keptIconsOf(JSON.parse(await readFile(this.file, 'utf8')));
    } catch {
      this.kept = {};
    }

    return this.kept;
  }

  private async keep(props: { origin: string; entry: ISiteIconEntry }): Promise<void> {
    const kept = { ...(await this.read()), [props.origin]: props.entry };

    this.kept = kept;
    await writeAtomically({ file: this.file, data: JSON.stringify(kept) }).catch(
      () => undefined,
    );
  }
}

import type { IAppNamesProps } from './types';
import type { AppNameSource } from '@/shared/types';
import { join } from 'node:path';
import { APP_NAMES } from './constants';
import { appNameOfManifest, bundleNameOf, labelOfBadging, siteNameOf } from './library';

/**
 * Lê o nome de um app sem IA: o que a página do site diz, o rótulo do build, ou o nome no
 * app.json do repositório.
 */
export class AppNames {
  private readonly fetcher: IAppNamesProps['fetcher'];
  private readonly run: IAppNamesProps['run'];
  private readonly aapt: IAppNamesProps['aapt'];
  private readonly isMac: boolean;
  private readonly github: IAppNamesProps['github'];

  public constructor(props: IAppNamesProps) {
    this.fetcher = props.fetcher;
    this.run = props.run;
    this.aapt = props.aapt;
    this.isMac = props.isMac;
    this.github = props.github;
  }

  /** O nome do app daquela fonte, ou null quando ela não diz um. */
  public async of(source: AppNameSource): Promise<string | null> {
    if (source.kind === 'web') return this.ofSite(source.address);

    if (source.kind === 'android') return this.ofApk(source.path);

    if (source.kind === 'ios') return this.ofApp(source.path);

    const answer = await this.github.api({
      path: `repos/${source.owner}/${source.name}/contents/app.json?ref=${encodeURIComponent(source.branch)}`,
      accept: 'application/vnd.github.raw',
    });

    return (answer.isOk ? appNameOfManifest(answer.text) : null) ?? source.name;
  }

  private async ofSite(address: string): Promise<string | null> {
    try {
      const answer = await this.fetcher(address, {
        signal: AbortSignal.timeout(APP_NAMES.waitMs),
        headers: { accept: 'text/html' },
      });

      return answer.ok
        ? siteNameOf((await answer.text()).slice(0, APP_NAMES.pageChars))
        : null;
    } catch {
      return null;
    }
  }

  private async ofApk(path: string): Promise<string | null> {
    const aapt = await this.aapt();
    const dumped =
      aapt === null
        ? null
        : await this.run({ command: aapt, args: ['dump', 'badging', path] });

    return dumped === null ? null : labelOfBadging(dumped);
  }

  private async ofApp(path: string): Promise<string | null> {
    if (!this.isMac) return null;

    for (const key of ['CFBundleDisplayName', 'CFBundleName']) {
      const printed = await this.run({
        command: 'plutil',
        args: ['-extract', key, 'raw', join(path, 'Info.plist')],
      });
      const name = printed === null ? null : bundleNameOf(printed);

      if (name !== null) return name;
    }

    return null;
  }
}

import type { Fetcher, IIntegrationVault, IStoredIntegration } from './types';
import type { IJiraCredentials, IVaultCipher } from '@/main/types';
import type {
  IConnectIntegration,
  IConnectResult,
  IGithubStatus,
  IIntegrationStatus,
  IntegrationId,
} from '@/shared/types';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { writeAtomically } from '@/main/library';
import { githubConnectionOf, isCurrentIntegration, verifyJira } from './library';

/**
 * Connects the QA's trackers: GitHub through the QA's own gh, Jira with a token sealed by
 * the OS keychain, and Confluence beside Jira when the QA turns it on.
 */
export class IntegrationVault {
  private readonly file: string;
  private readonly cipher: IVaultCipher;
  private readonly fetcher: Fetcher;
  private readonly github: () => Promise<IGithubStatus>;

  public constructor(props: IIntegrationVault) {
    this.file = props.file;
    this.cipher = props.cipher;
    this.fetcher = props.fetcher;
    this.github = props.github;
  }

  public async list(): Promise<IIntegrationStatus[]> {
    return (await this.read()).map(({ status }) => status);
  }

  public async connect(connecting: IConnectIntegration): Promise<IConnectResult> {
    if (!this.cipher.isAvailable())
      return { isConnected: false, failure: { reason: 'no-keychain' } };

    const result =
      connecting.id === 'github'
        ? githubConnectionOf({
            status: await this.github(),
            at: new Date().toISOString(),
          })
        : await verifyJira({ credentials: connecting, fetcher: this.fetcher });

    if (!result.isConnected) return result;

    const stored = await this.read();
    const before = stored.find(({ status }) => status.id === connecting.id)?.status;
    const status =
      before?.confluence === true
        ? { ...result.status, confluence: true }
        : result.status;
    const kept = stored.filter(({ status: one }) => one.id !== connecting.id);

    await this.write([...kept, { status, credentials: connecting }]);

    return { ...result, status };
  }

  public async disconnect(id: IntegrationId): Promise<void> {
    await this.write((await this.read()).filter(({ status }) => status.id !== id));
  }

  /**
   * Turns Confluence on or off beside Jira, on the same site and credentials, and says
   * Jira's status now; null while Jira is not connected.
   */
  public async setConfluence(isOn: boolean): Promise<IIntegrationStatus | null> {
    const stored = await this.read();
    const jira = stored.find(({ status }) => status.id === 'jira');

    if (jira === undefined) return null;

    const status = { ...jira.status, confluence: isOn };

    await this.write(stored.map((one) => (one === jira ? { ...one, status } : one)));

    return status;
  }

  /**
   * Jira's credentials for Confluence, on the same site; null while Jira is not connected
   * or Confluence is off.
   */
  public async confluence(): Promise<IJiraCredentials | null> {
    const jira = (await this.read()).find(({ status }) => status.id === 'jira');

    return jira?.status.confluence === true ? this.jira() : null;
  }

  /**
   * The Jira site and the credentials sealed for it, for main to call Jira with; null
   * while Jira is not connected.
   */
  public async jira(): Promise<IJiraCredentials | null> {
    const stored = (await this.read()).find(({ status }) => status.id === 'jira');

    if (stored?.credentials.id !== 'jira' || stored.status.site === null) return null;

    return {
      site: stored.status.site,
      email: stored.credentials.email.trim(),
      token: stored.credentials.token.trim(),
    };
  }

  private async read(): Promise<IStoredIntegration[]> {
    try {
      const sealed = await readFile(this.file);

      return (JSON.parse(this.cipher.decrypt(sealed)) as IStoredIntegration[]).filter(
        isCurrentIntegration,
      );
    } catch {
      return [];
    }
  }

  private async write(stored: IStoredIntegration[]): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeAtomically({
      file: this.file,
      data: this.cipher.encrypt(JSON.stringify(stored)),
    });
  }
}

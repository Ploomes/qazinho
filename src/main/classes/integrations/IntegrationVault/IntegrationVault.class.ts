import type {
  Fetcher,
  IIntegrationVault,
  IStoredIntegration,
  IVaultCipher,
} from './types';
import type {
  IConnectIntegration,
  IConnectResult,
  IIntegrationStatus,
  IntegrationId,
} from '@/types';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { TRACKER_ERRORS } from './constants';
import { verifyGithub, verifyJira } from './library';

/** Connects the QA's issue trackers, and keeps their tokens sealed by the OS keychain on this machine. */
export class IntegrationVault {
  private readonly file: string;
  private readonly cipher: IVaultCipher;
  private readonly fetcher: Fetcher;

  public constructor(props: IIntegrationVault) {
    this.file = props.file;
    this.cipher = props.cipher;
    this.fetcher = props.fetcher;
  }

  public async list(): Promise<IIntegrationStatus[]> {
    return (await this.read()).map(({ status }) => status);
  }

  public async connect(connecting: IConnectIntegration): Promise<IConnectResult> {
    if (!this.cipher.isAvailable())
      return { isConnected: false, error: TRACKER_ERRORS.noKeychain };

    const result =
      connecting.id === 'github'
        ? await verifyGithub({ token: connecting.token, fetcher: this.fetcher })
        : await verifyJira({ credentials: connecting, fetcher: this.fetcher });

    if (!result.isConnected) return result;

    const kept = (await this.read()).filter(({ status }) => status.id !== connecting.id);

    await this.write([...kept, { status: result.status, credentials: connecting }]);

    return result;
  }

  public async disconnect(id: IntegrationId): Promise<void> {
    await this.write((await this.read()).filter(({ status }) => status.id !== id));
  }

  private async read(): Promise<IStoredIntegration[]> {
    try {
      const sealed = await readFile(this.file);

      return JSON.parse(this.cipher.decrypt(sealed)) as IStoredIntegration[];
    } catch {
      return [];
    }
  }

  private async write(stored: IStoredIntegration[]): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, this.cipher.encrypt(JSON.stringify(stored)));
  }
}

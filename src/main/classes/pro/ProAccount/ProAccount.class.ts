import type { IProAccount, IStoredPro } from './types';
import type { IProDeviceCode, IProDeviceToken } from '@/main/classes/pro/ProApi';
import type { IVaultCipher } from '@/main/types';
import type {
  ProSignInFailure,
  ProSignInPhase,
  ProSignInProgress,
  ProStatus,
} from '@/shared/types';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { writeAtomically } from '@/main/library';
import { PRO_SIGN_IN, STORED_PRO_SCHEMA } from './constants';

/**
 * Signs this machine in to QAzinho Pro by a code the person confirms in the browser,
 * keeps its token sealed by the OS keychain, and says where it stands.
 */
export class ProAccount {
  private readonly api: IProAccount['api'];
  private readonly cipher: IVaultCipher;
  private readonly file: string;
  private readonly machineName: string;
  private readonly openUrl: (url: string) => Promise<void>;
  private readonly wait: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly onProgress: (progress: ProSignInProgress) => void;
  private signing: { isCancelled: boolean } | null = null;

  public constructor(props: IProAccount) {
    this.api = props.api;
    this.cipher = props.cipher;
    this.file = props.file;
    this.machineName = props.machineName;
    this.openUrl = props.openUrl;
    this.wait = props.wait;
    this.now = props.now;
    this.onProgress = props.onProgress;
  }

  /**
   * Where this machine stands, asking the platform; a token it refuses is forgotten, and
   * no answer keeps what was last known.
   */
  public async status(): Promise<ProStatus> {
    const stored = await this.read();

    if (stored === null) return this.signedOut();

    const me = await this.api.me(stored.token);

    if (me.isOk) {
      const fresh: IStoredPro = {
        ...stored,
        account: { email: me.value.user.email, name: me.value.user.name },
        orgs: me.value.orgs,
      };

      await this.write(fresh);

      return { isSignedIn: true, ...this.shown(fresh), isReachable: true };
    }

    if (me.status === 401) {
      await this.forget();

      return this.signedOut();
    }

    return { isSignedIn: true, ...this.shown(stored), isReachable: false };
  }

  /**
   * Signs this machine in: a code from the platform, the browser to confirm it, then the
   * token sealed by the keychain.
   */
  public async signIn(): Promise<ProSignInProgress> {
    if (!this.cipher.isAvailable())
      return this.report({ phase: 'failed', at: 'code', failure: 'no-keychain' });

    if (this.signing !== null) this.signing.isCancelled = true;

    const signing = { isCancelled: false };

    this.signing = signing;
    this.report({ phase: 'working', at: 'code', code: null, url: null });

    const code = await this.api.deviceCode(this.machineName);

    if (!code.isOk)
      return this.report({
        phase: 'failed',
        at: 'code',
        failure: code.error === 'unreachable' ? 'unreachable' : 'unexpected',
      });

    this.report({
      phase: 'working',
      at: 'browser',
      code: code.value.userCode,
      url: code.value.verificationUrl,
    });
    await this.openUrl(code.value.verificationUrl);

    const confirmed = await this.poll({ code: code.value, signing });

    if (confirmed === 'cancelled') return this.report({ phase: 'cancelled' });
    if (typeof confirmed === 'string')
      return this.report({ phase: 'failed', at: 'browser', failure: confirmed });

    this.report({ phase: 'working', at: 'account', code: null, url: null });
    await this.write({
      token: confirmed.token,
      machine: confirmed.machine,
      account: { email: confirmed.user.email, name: confirmed.user.name },
      orgs: confirmed.orgs,
    });

    return this.report({ phase: 'connected', account: confirmed.user.email });
  }

  public cancelSignIn(): void {
    if (this.signing !== null) this.signing.isCancelled = true;
  }

  /**
   * Signs this machine out: the platform stops taking its token, and the sealed file
   * goes.
   */
  public async signOut(): Promise<ProStatus> {
    const stored = await this.read();

    if (stored !== null) {
      await this.api.revokeMachine({ token: stored.token, machineId: stored.machine.id });
      await this.forget();
    }

    return this.signedOut();
  }

  /**
   * This machine's token, for the sync to call the platform with; null while signed out.
   */
  public async token(): Promise<string | null> {
    return (await this.read())?.token ?? null;
  }

  private async poll(props: {
    code: IProDeviceCode;
    signing: { isCancelled: boolean };
  }): Promise<IProDeviceToken | ProSignInFailure | 'cancelled'> {
    const deadline = this.now() + props.code.expiresIn * 1_000;
    const gap = Math.max(props.code.interval * 1_000, PRO_SIGN_IN.pollFloorMs);

    while (this.now() < deadline) {
      await this.wait(gap);

      if (props.signing.isCancelled) return 'cancelled';

      const answer = await this.api.deviceToken(props.code.deviceCode);

      if (answer.isOk) return answer.value;
      if (answer.error === 'authorization_pending' || answer.error === 'unreachable')
        continue;
      if (answer.error === 'access_denied') return 'denied';
      if (answer.error === 'expired_token') return 'expired';

      return 'unexpected';
    }

    return 'expired';
  }

  private signedOut(): ProStatus {
    return { isSignedIn: false, canKeepToken: this.cipher.isAvailable() };
  }

  private shown(stored: IStoredPro) {
    return {
      account: stored.account,
      machine: stored.machine,
      orgs: stored.orgs,
    };
  }

  private report(phase: ProSignInPhase): ProSignInProgress {
    const progress: ProSignInProgress = { steps: PRO_SIGN_IN.steps, ...phase };

    this.onProgress(progress);

    return progress;
  }

  private async read(): Promise<IStoredPro | null> {
    try {
      const sealed = await readFile(this.file);
      const read = STORED_PRO_SCHEMA.safeParse(JSON.parse(this.cipher.decrypt(sealed)));

      return read.success ? read.data : null;
    } catch {
      return null;
    }
  }

  private async write(stored: IStoredPro): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeAtomically({
      file: this.file,
      data: this.cipher.encrypt(JSON.stringify(stored)),
    });
  }

  private async forget(): Promise<void> {
    await rm(this.file, { force: true });
  }
}

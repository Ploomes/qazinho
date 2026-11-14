import type { IUpdaterListener } from '@/main/classes/setup/AppUpdater/types';
import type { AppUpdate } from '@/shared/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppUpdater } from '@/main/classes/setup/AppUpdater';
import { APP_UPDATE } from '@/main/classes/setup/AppUpdater/constants';

/** Um atualizador do sistema que o teste controla: conta as buscas e diz o que aconteceu. */
const setUp = (isAvailable = true, isStore = false) => {
  const seen: AppUpdate[] = [];
  const logged: string[] = [];
  const port = {
    checks: 0,
    installs: 0,
    listener: null as IUpdaterListener | null,
    failing: false,
    listen(listener: IUpdaterListener) {
      this.listener = listener;
    },
    check() {
      this.checks += 1;

      return this.failing ? Promise.reject(new Error('no network')) : Promise.resolve();
    },
    install() {
      this.installs += 1;
    },
  };
  const updater = new AppUpdater({
    port,
    isAvailable,
    isStore,
    onChange: (update) => seen.push(update),
    log: (message) => logged.push(message),
  });

  return { updater, port, seen, logged, say: () => port.listener as IUpdaterListener };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AppUpdater', () => {
  describe('looking on its own', () => {
    it('looks soon after opening, and then every few hours', () => {
      const { updater, port } = setUp();

      updater.start();
      vi.advanceTimersByTime(APP_UPDATE.firstCheckMs);

      expect(port.checks).toBe(1);

      vi.advanceTimersByTime(APP_UPDATE.everyMs);

      expect(port.checks).toBe(2);
      updater.stop();
    });

    it('does NOT look where it cannot update', () => {
      const { updater, port } = setUp(false);

      updater.start();
      vi.advanceTimersByTime(APP_UPDATE.everyMs);

      expect(port.checks).toBe(0);
    });

    it('stops looking once told', () => {
      const { updater, port } = setUp();

      updater.start();
      updater.stop();
      vi.advanceTimersByTime(APP_UPDATE.everyMs * 2);

      expect(port.checks).toBe(0);
    });
  });

  describe('a new version', () => {
    it('downloads, then says it is ready', () => {
      const { updater, say } = setUp();

      updater.start();
      say().available('0.2.0');
      say().progress(41.7);

      expect(updater.state()).toEqual({
        phase: 'downloading',
        version: '0.2.0',
        percent: 41,
        isRequired: false,
      });

      say().downloaded('0.2.0');

      expect(updater.state()).toEqual({
        phase: 'ready',
        version: '0.2.0',
        isRequired: false,
      });
      updater.stop();
    });

    // O progresso chega muitas vezes por segundo: a página só precisa ouvir quando o número muda.
    it('tells the page only when the percent changes', () => {
      const { updater, say, seen } = setUp();

      updater.start();
      say().available('0.2.0');
      say().progress(10.1);
      say().progress(10.8);
      say().progress(11.2);

      expect(seen).toHaveLength(3);
      updater.stop();
    });

    it('does NOT look again while one is downloading or ready', async () => {
      const { updater, port, say } = setUp();

      updater.start();
      say().available('0.2.0');
      await vi.advanceTimersByTimeAsync(APP_UPDATE.everyMs);
      say().downloaded('0.2.0');
      await vi.advanceTimersByTimeAsync(APP_UPDATE.everyMs);

      expect(port.checks).toBe(0);
      updater.stop();
    });

    it('installs only what is ready', () => {
      const { updater, port, say } = setUp();

      updater.start();
      updater.install();

      expect(port.installs).toBe(0);

      say().available('0.2.0');
      say().downloaded('0.2.0');
      updater.install();

      expect(port.installs).toBe(1);
      updater.stop();
    });
  });

  describe('when something goes wrong', () => {
    // Sem internet, ou sem release ainda: o QA não tem nada a ver com isso.
    it('stays quiet when an update is optional, and keeps the reason in the log', async () => {
      const { updater, port, logged } = setUp();

      updater.start();
      port.failing = true;
      await vi.advanceTimersByTimeAsync(APP_UPDATE.firstCheckMs);

      expect(updater.state()).toEqual({ phase: 'idle', isRequired: false });
      expect(logged).toEqual(['Error: no network']);
      updater.stop();
    });

    // O Mac só confere a assinatura e o zip depois de avisar que baixou. Sem isto, o botão
    // continuaria na tela sem fazer nada.
    it('takes back a version the system refuses after downloading it', () => {
      const { updater, say } = setUp();

      updater.start();
      say().available('0.2.0');
      say().downloaded('0.2.0');
      say().failed('the signature does not match');

      expect(updater.state()).toEqual({ phase: 'idle', isRequired: false });
      updater.stop();
    });

    // Baixar de novo daria no mesmo, e a tela piscaria a cada tentativa.
    it('does NOT try again after the system refused the version', async () => {
      const { updater, port, say } = setUp();

      updater.start();
      await vi.advanceTimersByTimeAsync(APP_UPDATE.firstCheckMs);
      say().available('0.2.0');
      say().downloaded('0.2.0');
      say().failed('the signature does not match');
      await vi.advanceTimersByTimeAsync(APP_UPDATE.everyMs);

      expect(port.checks).toBe(1);
      updater.stop();
    });

    it('offers the site right away once the install is known to be broken', () => {
      const { updater, say } = setUp();

      updater.start();
      say().available('0.2.0');
      say().downloaded('0.2.0');
      say().failed('the signature does not match');
      updater.require();

      expect(updater.state()).toEqual({ phase: 'failed', isRequired: true });
      updater.stop();
    });
  });

  describe('installing', () => {
    const ready = () => {
      const world = setUp();

      world.updater.start();
      world.say().available('0.2.0');
      world.say().downloaded('0.2.0');

      return world;
    };

    it('says it is installing as soon as it is asked', () => {
      const { updater } = ready();

      updater.install();

      expect(updater.state()).toEqual({ phase: 'installing', isRequired: false });
      updater.stop();
    });

    // Instalar fecha o app. Se ele seguiu aberto, algo falhou, e a tela não pode ficar esperando.
    it('gives up when the app stays open, and says why in the log', () => {
      const { updater, logged } = ready();

      updater.require();
      updater.install();
      vi.advanceTimersByTime(APP_UPDATE.installWaitMs);

      expect(updater.state()).toEqual({ phase: 'failed', isRequired: true });
      expect(logged).toHaveLength(1);
      updater.stop();
    });

    it('does NOT install twice', () => {
      const { updater, port } = ready();

      updater.install();
      updater.install();

      expect(port.installs).toBe(1);
      updater.stop();
    });
  });

  describe('when the API refuses this version', () => {
    it('becomes required and looks right away', () => {
      const { updater, port } = setUp();

      updater.require();

      expect(updater.state().isRequired).toBe(true);
      expect(port.checks).toBe(1);
      updater.stop();
    });

    it('says only once, however many calls are refused', () => {
      const { updater, port, seen } = setUp();

      updater.require();
      updater.require();
      updater.require();

      expect(seen).toHaveLength(1);
      expect(port.checks).toBe(1);
      updater.stop();
    });

    // A versão pode ainda estar subindo: a tela oferece o site, e a busca segue até achar.
    it('says it failed when nothing is found, and keeps trying every minute', async () => {
      const { updater, port, say } = setUp();

      updater.require();
      say().nothing();

      expect(updater.state()).toEqual({ phase: 'failed', isRequired: true });

      await vi.advanceTimersByTimeAsync(APP_UPDATE.requiredEveryMs);

      expect(port.checks).toBe(2);

      say().available('0.2.0');
      say().downloaded('0.2.0');

      expect(updater.state()).toEqual({
        phase: 'ready',
        version: '0.2.0',
        isRequired: true,
      });
      updater.stop();
    });

    it('stays required on a version already downloading', () => {
      const { updater, say } = setUp();

      updater.start();
      say().available('0.2.0');
      updater.require();
      say().progress(50);

      expect(updater.state()).toMatchObject({
        phase: 'downloading',
        percent: 50,
        isRequired: true,
      });
      updater.stop();
    });

    // No Linux fora de um AppImage não há o que baixar: resta o site.
    it('goes straight to the site where it cannot update', () => {
      const { updater, port } = setUp(false);

      updater.require();

      expect(updater.state()).toEqual({ phase: 'failed', isRequired: true });
      expect(port.checks).toBe(0);
    });

    // Uma cópia da Microsoft Store só atualiza pela loja, que leva dias para aprovar.
    it('sends a copy from the Microsoft Store to the store, without looking', () => {
      const { updater, port } = setUp(false, true);

      updater.require();

      expect(updater.state()).toEqual({ phase: 'store', isRequired: true });
      expect(port.checks).toBe(0);
    });
  });
});

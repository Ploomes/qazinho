import type { IAppNamesProps } from '@/main/classes/projects/AppNames';
import { describe, expect, it } from 'vitest';
import { AppNames } from '@/main/classes/projects/AppNames';

/** Os pedidos da classe, com as respostas que o teste escolhe para cada um. */
function namesWith(over: Partial<IAppNamesProps>) {
  const ran: string[][] = [];
  const names = new AppNames({
    fetcher: () => Promise.reject(new Error('offline')),
    run: ({ command, args }) => {
      ran.push([command, ...args]);

      return Promise.resolve(null);
    },
    aapt: () => Promise.resolve('/sdk/build-tools/35.0.0/aapt2'),
    isMac: true,
    github: {
      api: () =>
        Promise.resolve({
          isOk: false,
          failure: 'not-found' as const,
          httpStatus: 404,
          said: '',
        }),
    },
    ...over,
  });

  return { names, ran };
}

describe('AppNames', () => {
  it('reads a site by its page, and nothing when it does not answer', async () => {
    const page = '<title>Início | Loja Online</title>';
    const { names } = namesWith({
      fetcher: () =>
        Promise.resolve({
          ok: true,
          headers: { get: () => 'text/html' },
          text: () => Promise.resolve(page),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }),
    });

    expect(await names.of({ kind: 'web', address: 'https://loja.test' })).toBe(
      'Loja Online',
    );
    expect(
      await namesWith({}).names.of({ kind: 'web', address: 'https://loja.test' }),
    ).toBeNull();
  });

  it('reads an apk with the aapt2 of the QA’s SDK, and nothing without one', async () => {
    const { names, ran } = namesWith({
      run: () => Promise.resolve("application-label:'Loja'"),
    });

    expect(await names.of({ kind: 'android', path: '/b/loja.apk' })).toBe('Loja');
    expect(ran).toEqual([]);
    expect(
      await namesWith({ aapt: () => Promise.resolve(null) }).names.of({
        kind: 'android',
        path: '/b/loja.apk',
      }),
    ).toBeNull();
  });

  it('reads an .app by its display name, then its bundle name, and only on a Mac', async () => {
    const { names, ran } = namesWith({
      run: ({ args }) => Promise.resolve(args[1] === 'CFBundleName' ? 'Loja' : null),
    });

    expect(await names.of({ kind: 'ios', path: '/b/Loja.app' })).toBe('Loja');
    expect(ran).toEqual([]);
    expect(
      await namesWith({ isMac: false }).names.of({ kind: 'ios', path: '/b/Loja.app' }),
    ).toBeNull();
  });

  it('reads a repository by its app.json, else by its own name', async () => {
    const asked: string[] = [];
    const { names } = namesWith({
      github: {
        api: ({ path }) => {
          asked.push(path);

          return Promise.resolve({ isOk: true, text: '{"expo":{"name":"Loja"}}' });
        },
      },
    });
    const repository = {
      kind: 'repo' as const,
      owner: 'acme',
      name: 'loja-app',
      branch: 'main',
    };

    expect(await names.of(repository)).toBe('Loja');
    expect(asked).toEqual(['repos/acme/loja-app/contents/app.json?ref=main']);
    expect(await namesWith({}).names.of(repository)).toBe('loja-app');
  });
});

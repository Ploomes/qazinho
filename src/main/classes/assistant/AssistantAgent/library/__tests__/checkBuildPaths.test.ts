import { describe, expect, it } from 'vitest';
import { checkBuildPaths } from '@/main/classes/assistant/AssistantAgent/library';

/** Um disco que guarda um .apk e um .app de simulador, e nada mais. */
const DISK: Record<string, 'file' | 'directory'> = {
  '/Users/qa/Downloads/loja.apk': 'file',
  '/Users/qa/Builds/Loja.app': 'directory',
};

const kindOf = (path: string) => Promise.resolve(DISK[path] ?? null);

describe('checkBuildPaths', () => {
  it('makes a path from home whole, and lets a build that is on disk through', async () => {
    expect(
      await checkBuildPaths({
        call: {
          name: 'create_project',
          args: {
            name: 'Loja',
            android: '~/Downloads/loja.apk',
            ios: '/Users/qa/Builds/Loja.app/',
          },
        },
        home: '/Users/qa',
        kindOf,
      }),
    ).toEqual({
      isOk: true,
      call: {
        name: 'create_project',
        args: {
          name: 'Loja',
          android: '/Users/qa/Downloads/loja.apk',
          ios: '/Users/qa/Builds/Loja.app',
        },
      },
    });
  });

  it('keeps an empty build, which removes the target, without looking for it', async () => {
    expect(
      await checkBuildPaths({
        call: { name: 'update_project', args: { project: 'p-1', android: '' } },
        home: '/Users/qa',
        kindOf: () => Promise.reject(new Error('looked')),
      }),
    ).toEqual({
      isOk: true,
      call: { name: 'update_project', args: { project: 'p-1', android: '' } },
    });
  });

  it('does NOT let through a build that is not on disk', async () => {
    expect(
      await checkBuildPaths({
        call: {
          name: 'update_project',
          args: { project: 'p-1', android: '/tmp/gone.apk' },
        },
        home: '/Users/qa',
        kindOf,
      }),
    ).toEqual({ isOk: false, text: 'There is no .apk at /tmp/gone.apk.' });
  });

  it('refuses an .ipa for iOS and a folder for Android, saying what each runs', async () => {
    expect(
      await checkBuildPaths({
        call: { name: 'create_project', args: { name: 'Loja', ios: '/tmp/Loja.ipa' } },
        home: '/Users/qa',
        kindOf,
      }),
    ).toEqual({
      isOk: false,
      text: '/tmp/Loja.ipa is not a simulator .app: iOS runs an .app folder built for the simulator, not an .ipa.',
    });
    expect(
      await checkBuildPaths({
        call: {
          name: 'create_project',
          args: { name: 'Loja', android: '/Users/qa/Builds/Loja.app' },
        },
        home: '/Users/qa',
        kindOf,
      }),
    ).toEqual({
      isOk: false,
      text: '/Users/qa/Builds/Loja.app is not an .apk: Android runs an .apk file.',
    });
  });

  it('leaves every other call alone', async () => {
    const call = { name: 'go_home' as const, args: {} };

    expect(await checkBuildPaths({ call, home: '/Users/qa', kindOf })).toEqual({
      isOk: true,
      call,
    });
  });
});

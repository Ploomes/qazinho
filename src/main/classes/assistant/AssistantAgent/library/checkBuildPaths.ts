import type { AppToolCall } from '@/shared/types';

type PathKind = 'file' | 'directory' | null;

/**
 * Os builds de uma chamada de projeto como caminhos inteiros, cada um conferido no disco:
 * um alvo Android é um arquivo .apk, um iOS uma pasta .app; senão, por quê não.
 */
export async function checkBuildPaths(props: {
  call: AppToolCall;
  home: string;
  kindOf: (path: string) => Promise<PathKind>;
}): Promise<{ isOk: true; call: AppToolCall } | { isOk: false; text: string }> {
  const { call, home, kindOf } = props;

  if (call.name !== 'create_project' && call.name !== 'update_project')
    return { isOk: true, call };

  const android = whole({ path: call.args.android, home });
  const ios = whole({ path: call.args.ios, home });
  const problem = await problemOf({ android, ios, kindOf });

  if (problem !== null) return { isOk: false, text: problem };

  const builds = {
    ...(android === undefined ? {} : { android }),
    ...(ios === undefined ? {} : { ios }),
  };

  return call.name === 'create_project'
    ? { isOk: true, call: { name: call.name, args: { ...call.args, ...builds } } }
    : { isOk: true, call: { name: call.name, args: { ...call.args, ...builds } } };
}

function whole(props: { path: string | undefined; home: string }): string | undefined {
  if (props.path === undefined || props.path === '') return props.path;

  return props.path.replace(/^~(?=$|[\\/])/, props.home).replace(/(.)[\\/]+$/, '$1');
}

async function problemOf(props: {
  android: string | undefined;
  ios: string | undefined;
  kindOf: (path: string) => Promise<PathKind>;
}): Promise<string | null> {
  const { android, ios, kindOf } = props;

  if (android !== undefined && android !== '') {
    if (!android.toLowerCase().endsWith('.apk'))
      return `${android} is not an .apk: Android runs an .apk file.`;

    if ((await kindOf(android)) !== 'file') return `There is no .apk at ${android}.`;
  }

  if (ios !== undefined && ios !== '') {
    if (!ios.toLowerCase().endsWith('.app'))
      return `${ios} is not a simulator .app: iOS runs an .app folder built for the simulator, not an .ipa.`;

    if ((await kindOf(ios)) !== 'directory') return `There is no .app at ${ios}.`;
  }

  return null;
}

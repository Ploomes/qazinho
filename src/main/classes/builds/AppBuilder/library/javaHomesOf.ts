import { posix, win32 } from 'node:path';

/** Where Android Studio keeps the JDK it builds with, on this platform: the folders to try when JAVA_HOME is not set. */
export function javaHomesOf(props: {
  platform: NodeJS.Platform;
  home: string;
  env: Record<string, string | undefined>;
}): string[] {
  if (props.platform === 'win32') {
    const programFiles = props.env.ProgramFiles ?? 'C:\\Program Files';
    const localAppData =
      props.env.LOCALAPPDATA ?? win32.join(props.home, 'AppData', 'Local');

    return [
      win32.join(programFiles, 'Android', 'Android Studio', 'jbr'),
      win32.join(localAppData, 'Programs', 'Android Studio', 'jbr'),
      win32.join(programFiles, 'Android', 'Android Studio', 'jre'),
    ];
  }

  if (props.platform === 'darwin')
    return [
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
      posix.join(
        props.home,
        'Applications/Android Studio.app/Contents/jbr/Contents/Home',
      ),
    ];

  return [
    '/opt/android-studio/jbr',
    '/usr/local/android-studio/jbr',
    '/snap/android-studio/current/jbr',
    posix.join(props.home, 'android-studio', 'jbr'),
  ];
}

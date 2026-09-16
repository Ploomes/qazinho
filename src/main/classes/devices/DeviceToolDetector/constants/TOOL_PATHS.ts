/** Where each toolchain lands by default, after the environment variable it usually sets. */
export const TOOL_PATHS = {
  androidSdk: ['Library/Android/sdk', 'Android/Sdk', 'AppData/Local/Android/Sdk'],
  xcode: ['/Applications/Xcode.app'],
  idb: ['/opt/homebrew/bin', '/usr/local/bin', '/opt/local/bin'],
} as const;

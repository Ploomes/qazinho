/** What gocrash found on this machine. It installs nothing: it looks, and says what is missing. */
export const MACHINE = {
  androidSdk: { isFound: true, note: 'Android SDK found', path: '~/Library/Android/sdk' },
  xcode: { isFound: false, note: 'Xcode not found', path: 'not found' },
} as const;

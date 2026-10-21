export const APP_BUILDER = {
  scopePrefix: '~build:',
  progressMs: 250,
  searchDepth: 10,
  skip: [
    'node_modules',
    '.git',
    'Pods',
    '.gradle',
    '.gradle-home',
    '.npm-cache',
    '.dart_tool',
  ],
  javaHomes: ['/Applications/Android Studio.app/Contents/jbr/Contents/Home'],
} as const;

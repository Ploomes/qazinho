import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { flatConfigs as importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { config, configs } from 'typescript-eslint';

const NO_UPWARD_RELATIVE = {
  regex: '^\\.\\./',
  message:
    'Use the @/ alias instead of an upward relative path. Only ./ within the same directory is allowed.',
};

const NO_NODE_IN_THE_PAGE = {
  group: ['node:*', 'fs', 'path', 'os', 'child_process', 'worker_threads', 'electron'],
  message:
    'This code runs in the page. No Node builtins and no electron: ask the main process through window.gocrash.',
};

const NO_PAGE_IN_NODE = {
  group: [
    '@/components/**',
    '@/modules/**',
    '@/store/**',
    '@/hooks/**',
    '@/services/**',
    '@/styles/**',
  ],
  message:
    'The main process and the preload never import the page. Share a type through @/types.',
};

const NO_FRAMER_MOTION = {
  group: ['framer-motion'],
  message: 'Motion ships as `motion`: import from `motion/react`.',
};

const NO_NODE_FOLDERS_IN_THE_PAGE = {
  group: ['@/main/**', '**/electron/**'],
  message:
    'The page never imports src/main or electron/. Ask the main process through window.gocrash.',
};

export default config(
  { ignores: ['out', 'dist', 'release', 'node_modules', 'coverage', 'assets'] },

  js.configs.recommended,
  ...configs.recommendedTypeChecked,
  importX.recommended,
  importX.typescript,

  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: ['./tsconfig.node.json', './tsconfig.web.json'],
        }),
      ],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: false },
      ],

      'import-x/order': [
        'error',
        {
          groups: [
            ['type'],
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': ['error', { 'prefer-inline': false }],
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [NO_UPWARD_RELATIVE] },
      ],

      '@typescript-eslint/require-await': 'off',

      'max-params': ['error', 2],

      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: {
            memberTypes: [
              'signature',
              'field',
              'constructor',
              'public-method',
              'protected-method',
              'private-method',
              '#private-method',
            ],
          },
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['src/main/**/*.ts', 'electron/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [NO_UPWARD_RELATIVE, NO_PAGE_IN_NODE] },
      ],
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/main/**/*.ts'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': [
        'error',
        { patterns: [NO_NODE_IN_THE_PAGE, NO_FRAMER_MOTION] },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [NO_UPWARD_RELATIVE, NO_NODE_FOLDERS_IN_THE_PAGE] },
      ],
    },
  },

  {
    // @/types is imported by the page, by src/main and by the preload, so it imports none of them.
    files: ['src/types/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [NO_NODE_IN_THE_PAGE] }],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [NO_UPWARD_RELATIVE, NO_NODE_FOLDERS_IN_THE_PAGE, NO_PAGE_IN_NODE],
        },
      ],
    },
  },

  {
    // A class holds the class, a view holds the JSX, a view model holds the state. Each file
    // holds one thing: a function belongs in `library/`, a value in `constants/`, a type in
    // `types/`. A `library/` file may keep a private helper, because it still exports one thing.
    files: ['**/*.class.ts', 'src/**/hooks/**/index.ts', 'src/**/*.tsx'],
    ignores: ['src/index.tsx', 'src/**/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program > FunctionDeclaration',
          message:
            'This file holds one thing. Move the function to library/, where it gets its own file and its own test.',
        },
        {
          selector:
            'Program > ExportNamedDeclaration > FunctionDeclaration, Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type=/FunctionExpression|ArrowFunctionExpression/]:not([id.name=/^use[A-Z]/]):not([id.name=/^[A-Z]/])',
          message:
            'This file holds one thing. Move the function to library/, where it gets its own file and its own test.',
        },
        {
          selector: 'Program > VariableDeclaration',
          message:
            'This file holds one thing. Move the value to constants/, one per file, named.',
        },
        {
          selector:
            'Program > TSTypeAliasDeclaration, Program > TSInterfaceDeclaration, Program > ExportNamedDeclaration > TSTypeAliasDeclaration, Program > ExportNamedDeclaration > TSInterfaceDeclaration',
          message:
            'This file holds one thing. Move the type to types/, one type per file.',
        },
      ],
    },
  },

  {
    files: ['src/**/__tests__/**/*.{ts,tsx}', '*.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
    },
  },

  {
    files: ['**/*.{js,mjs}'],
    ...configs.disableTypeChecked,
  },

  prettier,
);

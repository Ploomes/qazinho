import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { flatConfigs as importX } from 'eslint-plugin-import-x';
import { config, configs } from 'typescript-eslint';

const NO_UPWARD_RELATIVE = {
  regex: '^\\.\\./',
  message:
    'Use the @/ alias instead of an upward relative path. Only ./ within the same directory is allowed.',
};

export default config(
  { ignores: ['out', 'dist', 'release', 'node_modules', 'coverage'] },

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
    files: ['**/*.{js,mjs}'],
    ...configs.disableTypeChecked,
  },

  prettier,
);

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { config, configs } from 'typescript-eslint';

export default config(
  { ignores: ['out', 'dist', 'release', 'node_modules', 'coverage'] },

  js.configs.recommended,
  ...configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
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

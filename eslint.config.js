import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'docs/screenshots/**', 'package-lock.json']
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-undef': 'error'
    }
  },
  {
    files: ['tests/**'],
    rules: {
      'no-console': 'off'
    }
  }
];

import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(
  { ignores: ['node_modules/**', 'functions/node_modules/**', '.cache/**', 'dist/**', 'dist-native/**', '.agents/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  { languageOptions: { globals: { console: 'readonly', process: 'readonly', __DEV__: 'readonly', fetch: 'readonly', Buffer: 'readonly', URL: 'readonly', AbortSignal: 'readonly', setTimeout: 'readonly' } }, rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['functions/*.js'], languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', exports: 'writable', module: 'readonly' } }, rules: { '@typescript-eslint/no-require-imports': 'off' } }
);

import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

import { baseConfig } from './base.js';

/**
 * ESLint flat config for React workspaces.
 */
export const reactConfig = tseslint.config(
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Component modules in this template intentionally co-export style
      // variants and small helpers, which this rule flags.
      'react-refresh/only-export-components': 'off',
    },
  },
);

export default reactConfig;

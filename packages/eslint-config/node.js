import tseslint from 'typescript-eslint';

import { baseConfig } from './base.js';

/**
 * ESLint flat config for Node/NestJS workspaces.
 */
export const nodeConfig = tseslint.config(
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
      },
    },
  },
);

export default nodeConfig;

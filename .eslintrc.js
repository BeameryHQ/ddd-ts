module.exports = {
  extends: ['plugin:prettier/recommended'],
  env: {
    es2020: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      plugins: ['@typescript-eslint/eslint-plugin', 'eslint-plugin-tsdoc'],
      parserOptions: {
        project: 'tsconfig.json',
      },
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
            project: 'tsconfig.json',
          },
        },
      },
      rules: {
        // If enabled, all exported functions require explicit return types
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        // We need to use the TS version of this rule.
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        // Enables TSDoc linting.
        'tsdoc/syntax': 'warn',
      },
    },
    {
      files: ['*test.ts'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:jest/recommended', 'plugin:jest/style'],
      env: {
        node: true,
        jest: true,
      },
    },
  ],
};

import eslintConfig from '@gen-epix/eslint-config';

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
eslintConfig
  .filter((config) => config.languageOptions?.parserOptions?.project)
  .forEach((config) => {
    config.languageOptions.parserOptions.project = './tsconfig.json';
    config.languageOptions.parserOptions.tsconfigRootDir = import.meta.dirname;
  });

export default eslintConfig;

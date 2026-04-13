import baseEslintConfig from '@gen-epix/eslint-config';

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
const eslintConfig = baseEslintConfig.map((config) => ({
  ...config,
  ...(config.files ? { files: [...config.files] } : {}),
  ...(config.ignores ? { ignores: [...config.ignores] } : {}),
  ...(config.languageOptions
    ? {
        languageOptions: {
          ...config.languageOptions,
          ...(config.languageOptions.parserOptions
            ? { parserOptions: { ...config.languageOptions.parserOptions } }
            : {}),
        },
      }
    : {}),
}));

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
eslintConfig
  .filter((config) => config.languageOptions?.parserOptions?.project)
  .forEach((config) => {
    config.languageOptions.parserOptions.project = './tsconfig.json';
    config.languageOptions.parserOptions.tsconfigRootDir = import.meta.dirname;
  });

// Ignore the api directory as it is auto generated
/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
eslintConfig.find(c => c.files && c.files.includes('**/*.ts')).ignores.push('**/api/**');

// Example of adding a custom rule
// /** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
// const rules = eslintConfig.find(c => c.files && c.files.includes('**/*.ts')).rules;
// rules['@stylistic/jsx-sort-props'] = ['error', {
//   ignoreCase: true,
//   callbacksLast: true,
//   shorthandFirst: true,
//   reservedFirst: true,
//   noSortAlphabetically: true,
//   multiline: 'ignore',
// }];


export default eslintConfig;

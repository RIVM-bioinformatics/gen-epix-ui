import eslintConfig from '@gen-epix/eslint-config';

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

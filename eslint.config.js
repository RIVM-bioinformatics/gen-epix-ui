import eslintConfig from '@gen-epix/eslint-config';

// Ignore the api directory as it is auto generated
/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
eslintConfig.find(c => c.files && c.files.includes('**/*.ts')).ignores.push('**/api/**');

export default eslintConfig;

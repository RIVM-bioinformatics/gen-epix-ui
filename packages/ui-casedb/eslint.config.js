import baseEslintConfig from '@gen-epix/eslint-config';

// Override: 'Stratification' is exported as a type from models/epi and as a component value
// from components/ui/Stratification. TypeScript supports type+value merging, but
// import-x/export v4.x does not distinguish re-exports by namespace, so the rule
// is disabled for index.ts where both are re-exported.
const overrides = [
  {
    files: ['src/index.ts'],
    rules: {
      'import-x/export': 'off',
    },
  },
];

export default [...baseEslintConfig, ...overrides];

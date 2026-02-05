import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: [
    'en',
    'nl',
  ],
  extract: {
    input: 'src/**/*.{ts,tsx}',
    output: 'src/locales/{{language}}.json',
    mergeNamespaces: true,
    keySeparator: false,
    nsSeparator: '🤖',
  },
});

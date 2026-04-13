import {
  defineConfig,
  esmExternalRequirePlugin,
} from 'vite';

import dts from './dts-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: './src/api/index.ts',
      fileName: () => {
        return 'index.js';
      },
      formats: ['es'],
    },
    rolldownOptions: {
      plugins: [
        esmExternalRequirePlugin({
          external: [
            /^axios(\/.+)?$/,
          ],
        }),
      ],
      treeshake: true,
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
});

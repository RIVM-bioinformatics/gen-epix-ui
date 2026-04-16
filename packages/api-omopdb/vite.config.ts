import {
  defineConfig,
  esmExternalRequirePlugin,
} from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: './src/index.ts',
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

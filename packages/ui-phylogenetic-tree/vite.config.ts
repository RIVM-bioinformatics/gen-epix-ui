/// <reference types="vitest" />

import {
  globSync,
  readFileSync,
} from 'fs';
import {
  dirname,
  join,
} from 'path';

import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { esmExternalRequirePlugin } from 'vite';

type PackageManifest = {
  peerDependencies?: Record<string, string>;
};

const createPeerDependencyExternalPatterns = () => {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, 'package.json'), 'utf8'),
  ) as PackageManifest;

  return Object.keys(packageJson.peerDependencies ?? {}).map((dependency) => {
    const escapedDependency = dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escapedDependency}(?:/.+)?$`);
  });
};

const peerDependencyExternalPatterns = createPeerDependencyExternalPatterns();

const isHeadlessTestRun = process.argv.includes('run') || !!process.env.CI;

const discoverEntries = (): { entries: Record<string, string>; flatKeys: Set<string> } => {
  const entries: Record<string, string> = {};
  const flatKeys = new Set<string>();

  const srcDir = join(__dirname, 'src');

  // index.ts-based entries (classes, utils): key = component directory
  globSync([
    join(srcDir, 'components', '**', 'index.ts'),
    join(srcDir, 'utils', '**', 'index.ts'),
  ]).forEach((file) => {
    const relKey = dirname(file).replace(`${srcDir}/`, '');
    entries[relKey] = `./${file.replace(`${__dirname}/`, '')}`;
  });

  // flat .ts entries (models): key = file path without extension
  globSync([join(srcDir, 'models', '*.ts')])
    .filter((file) => !file.endsWith('/index.ts'))
    .forEach((file) => {
      const relKey = file.replace(`${srcDir}/`, '').replace(/\.ts$/, '');
      entries[relKey] = `./${file.replace(`${__dirname}/`, '')}`;
      flatKeys.add(relKey);
    });

  return { entries, flatKeys };
};

const { entries: libEntries, flatKeys } = discoverEntries();

// https://vitejs.dev/config/
// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: libEntries,
      fileName: (_, entryAlias) => {
        if (entryAlias === 'index') {
          return 'index.js';
        }
        // flat .ts entries output alongside their .d.ts; index.ts entries output in a subdirectory
        return flatKeys.has(entryAlias) ? `${entryAlias}.js` : `${entryAlias}/index.js`;
      },
      formats: ['es'],
    },
    rolldownOptions: {
      output: {
        chunkFileNames: '_chunks/[name].js',
      },
      plugins: [
        esmExternalRequirePlugin({
          external: peerDependencyExternalPatterns,
        }),
      ],
      treeshake: true,
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      entryRoot: './src',
      insertTypesEntry: false,
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  test: {
    coverage: {
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'build/',
        'src/api/**/*',
        '**/*.config.{js,ts}',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        '**/test/**',
        '**/tests/**',
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
    projects: [
      {
        plugins: [
          {
            configResolved: () => {
              // createIndex();
            },
            name: 'on-config-resolved',
          },
        ],
        test: {
          environment: 'jsdom',
          globals: true,
          include: [
            'src/**/*.test.ts',
          ],
          name: 'unit',
          setupFiles: ['./src/test/setup/setup-jsdom.ts'],
          testTimeout: 5000,
        },
      },
      {
        plugins: [
          react(),
        ],
        test: {
          browser: {
            enabled: true,
            headless: isHeadlessTestRun,
            // https://vitest.dev/config/browser/playwright
            instances: [
              { browser: 'chromium' },
            ],
            provider: playwright(),
            screenshotDirectory: join(__dirname, '__screenshots__'),
            viewport: {
              height: 1080,
              width: 1920,
            },
          },
          globals: true,
          include: [
            'src/**/*.test.tsx',
          ],
          name: 'browser',
          server: {
            deps: {
              inline: ['@gen-epix/ui', '@gen-epix/ui-phylogenetic-tree', '@gen-epix/ui-core', 'vitest-browser-react'],
            },
          },
          setupFiles: ['./src/test/setup/setup-browser.ts'],
          testTimeout: 30000,
        },
      },
    ],
  },
});

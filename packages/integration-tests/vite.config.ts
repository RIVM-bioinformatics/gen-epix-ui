/// <reference types="vitest" />

import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
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
          react(),
        ],
        test: {
          browser: {
            enabled: true,
            headless: !!process.env.CI,
            // https://vitest.dev/config/browser/playwright
            instances: [
              { browser: 'chromium' },
            ],
            provider: playwright(),
            viewport: {
              height: 1080,
              width: 1920,
            },
          },
          globals: true,
          include: [
            'src/tests/**/*.test.tsx',
          ],
          name: 'browser',
          setupFiles: ['./src/setup.ts'],
          testTimeout: 30000,
        },
      },
    ],
  },
});

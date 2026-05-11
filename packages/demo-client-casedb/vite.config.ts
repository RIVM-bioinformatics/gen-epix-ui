/// <reference types="vitest" />

import * as child from 'child_process';
import { resolve } from 'path';
import { readFileSync } from 'fs';

import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';
import {
  esmExternalRequirePlugin,
  normalizePath,
} from 'vite';
import { defineConfig } from 'vitest/config';
import { findGitRootPath } from '@gen-epix/tools-lib';

import packageJson from './package.json';

let commitHash = 'not-a-git-repo';
try {
  commitHash = child.execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not a git repo or git is unavailable
}

const proxyThrottleConfig: { [key: string]: number } = {
  // '/v1/outages/0191fb18-7ef9-e584-1666-28d37e8e4079': 5000,
};

const gitRootPath = findGitRootPath();

const proxyResponseCodeConfig: {
  [key: string]: {
    code: number;
    method: 'DELETE' | 'GET' | 'POST' | 'PUT';
  };
} = {
  // '/v1/outages/0191fb18-7ef9-e584-1666-28d37e8e4079': {
  //   code: 500,
  //   method: 'DELETE',
  // },
};

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
      },
    },
  },
  define: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __COMMIT_HASH__: JSON.stringify(commitHash.trim()),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __PACKAGE_JSON_VERSION__: JSON.stringify((packageJson.version as unknown as string).trim()),
  },
  html: {
    cspNonce: '**CSP_NONCE**',
  },
  optimizeDeps: {
    rolldownOptions: {
      plugins: [esmExternalRequirePlugin()],
    },
  },
  plugins: [
    react(),
    svgr(),
    viteStaticCopy({
      targets: [
        {
          dest: './locale',
          rename: { stripBase: true },
          src: [
            './src/locale',
          ],
        },
        {
          dest: './locale/ui',
          rename: (fileName, fileExtension) => `../../../${fileName}.${fileExtension}`,
          src: [
            normalizePath(resolve(gitRootPath, 'packages', 'ui', 'src', 'locale', '*.json')),
          ],
        },
        {
          dest: './locale/ui-casedb',
          rename: (fileName, fileExtension) => `../../../${fileName}.${fileExtension}`,
          src: [
            normalizePath(resolve(gitRootPath, 'packages', 'ui-casedb', 'src', 'locale', '*.json')),
          ],
        },
      ],
    }),
  ],
  resolve: {
    // All peer dependencies of @gen-epix/ui should be deduplicated to the local node_modules version
    // This is to prevent issues with multiple versions of the same package (replaces explicit path aliases
    // which caused rolldown CJS `require` errors in Vite 8)
    dedupe: [
      '@emotion/cache',
      '@emotion/react',
      '@emotion/styled',
      '@mui/icons-material',
      '@mui/material',
      '@mui/styled-engine',
      '@mui/system',
      '@mui/utils',
      '@mui/x-date-pickers',
      'i18next',
      'react-dom',
      'react-i18next',
      'react',
    ],
  },
  server: {
    https: process.env.NODE_ENV === 'development' && {
      cert: readFileSync(resolve(gitRootPath, 'cert', 'cert.pem')),
      key: readFileSync(resolve(gitRootPath, 'cert', 'key.pem')),
    },
    open: true,
    port: 5010,
    proxy: {
      '^\\/v[\\d\\.]+\\/.*': {
        bypass: async (req, res) => {
          const throttle = proxyThrottleConfig[req.url];
          const responseConfig = proxyResponseCodeConfig[req.url];

          if (throttle) {
            await new Promise((r) => setTimeout(r, throttle));
          }
          if (responseConfig?.method === req.method) {
            res.statusCode = responseConfig.code;
            res.end();
            return false;
          }
        },
        changeOrigin: true,
        secure: false,
        target: 'https://0.0.0.0:8000',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 5000,
  },
});

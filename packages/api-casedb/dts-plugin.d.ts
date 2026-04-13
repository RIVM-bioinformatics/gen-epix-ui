import type { Plugin } from 'vite';

export interface PluginOptions {
  insertTypesEntry?: boolean;
  rollupTypes?: boolean;
  tsconfigPath?: string;
}

export default function dts(options?: PluginOptions): Plugin;

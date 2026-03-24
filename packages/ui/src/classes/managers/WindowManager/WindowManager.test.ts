// @vitest-environment jsdom

import { vi } from 'vitest';

import { WindowManager } from './WindowManager';

describe('WindowManager', () => {
  let windowManager: WindowManager;

  beforeEach(() => {
    WindowManager['__instance'] = undefined;
    windowManager = WindowManager.instance;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWindow', () => {
    it('should expose the window', () => {
      expect(windowManager.window).toBe(window);
    });
  });
});

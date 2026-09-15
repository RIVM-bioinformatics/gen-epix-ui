// @vitest-environment jsdom

import { vi } from 'vitest';

import { WindowService } from './WindowService';

describe('WindowService', () => {
  let windowService: WindowService;

  beforeEach(() => {
    WindowService['__instance'] = undefined;
    windowService = WindowService.getInstance();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWindow', () => {
    it('should expose the window', () => {
      expect(windowService.window).toBe(window);
    });
  });
});

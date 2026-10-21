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

  it('exposes the document, body, and cached service instance', () => {
    expect(windowService.document).toBe(document);
    expect(windowService.body).toBe(document.body);
    expect(WindowService.getInstance()).toBe(windowService);
  });

  it('returns null for the document and body when no window is available', () => {
    Object.defineProperty(windowService, 'window', {
      configurable: true,
      get: () => undefined,
    });

    expect(windowService.document).toBeNull();
    expect(windowService.body).toBeNull();
  });
});

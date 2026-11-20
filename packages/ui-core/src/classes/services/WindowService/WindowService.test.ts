// @vitest-environment jsdom

import { vi } from 'vitest';
import { container } from 'tsyringe';

import { WindowService } from './WindowService';

describe('WindowService', () => {
  let windowService: WindowService;

  beforeEach(() => {
    container.reset();
    windowService = WindowService.getInstance();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('returns null for the document and body when no document is available', () => {
    vi.stubGlobal('document', undefined);

    expect(windowService.document).toBeNull();
    expect(windowService.body).toBeNull();
  });
});

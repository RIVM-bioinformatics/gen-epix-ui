import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { render } from 'vitest-browser-react';

import { useOsxScrollbarAlwaysVisible } from './useOsxScrollbarAlwaysVisible';

const SCROLLBAR_STYLE_SELECTOR = '[data-scrollbar-setting="overlay"] ::-webkit-scrollbar';

const HookHarness = ({ nonce }: { readonly nonce?: string }) => {
  useOsxScrollbarAlwaysVisible(nonce);
  return <div />;
};

const getScrollbarStyles = (): HTMLStyleElement[] => Array.from(document.head.querySelectorAll('style'))
  .filter((style) => style.textContent?.includes(SCROLLBAR_STYLE_SELECTOR) ?? false);

const setScrollbarProbeClientWidth = (clientWidth: number): void => {
  const appendChild = document.body.appendChild.bind(document.body);
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    if (node instanceof HTMLDivElement && node.style.overflow === 'scroll' && node.style.width === '50px') {
      Object.defineProperty(node, 'offsetWidth', { configurable: true, value: 50 });
      Object.defineProperty(node, 'clientWidth', { configurable: true, value: clientWidth });
    }
    return appendChild(node);
  });
};

describe('useOsxScrollbarAlwaysVisible', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-scrollbar-setting');
    vi.restoreAllMocks();
  });

  it('detects overlay scrollbars without a nonce and cleans up after nonce changes and unmount', async () => {
    setScrollbarProbeClientWidth(50);
    const renderResult = await render(
      <HookHarness />,
    );

    expect(document.documentElement.getAttribute('data-scrollbar-setting')).toBe('overlay');
    expect(document.querySelector('body > div[style*="overflow: scroll"][style*="width: 50px"]')).toBeNull();
    expect(getScrollbarStyles()).toHaveLength(1);
    expect(getScrollbarStyles()[0].hasAttribute('nonce')).toBe(false);

    await renderResult.rerender(
      <HookHarness nonce={''} />,
    );

    expect(getScrollbarStyles()).toHaveLength(1);
    expect(getScrollbarStyles()[0].hasAttribute('nonce')).toBe(false);

    await renderResult.unmount();

    expect(getScrollbarStyles()).toHaveLength(0);
  });

  it('detects always-visible scrollbars and applies a nonce', async () => {
    setScrollbarProbeClientWidth(35);
    const renderResult = await render(
      <HookHarness nonce={'test-nonce'} />,
    );

    expect(document.documentElement.getAttribute('data-scrollbar-setting')).toBe('always');
    expect(getScrollbarStyles()).toHaveLength(1);
    expect(getScrollbarStyles()[0].nonce).toBe('test-nonce');

    await renderResult.rerender(
      <HookHarness nonce={'updated-nonce'} />,
    );

    expect(getScrollbarStyles()).toHaveLength(1);
    expect(getScrollbarStyles()[0].nonce).toBe('updated-nonce');

    await renderResult.unmount();

    expect(getScrollbarStyles()).toHaveLength(0);
  });
});

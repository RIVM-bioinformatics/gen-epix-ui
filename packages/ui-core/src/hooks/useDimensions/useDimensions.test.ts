import {
  act,
  renderHook,
} from '@testing-library/react';
import { createRef } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useDimensions } from './useDimensions';

const resizeObservers: MockResizeObserver[] = [];

class MockResizeObserver implements ResizeObserver {
  public readonly callback: ResizeObserverCallback;
  public readonly disconnect = vi.fn<() => void>();
  public readonly observe = vi.fn<(target: Element, options?: ResizeObserverOptions) => void>();
  public readonly unobserve = vi.fn<(target: Element) => void>();

  public constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push(this);
  }
}

const createResizeEntry = (width: number, height: number): ResizeObserverEntry => ({
  borderBoxSize: [],
  contentBoxSize: [],
  contentRect: new DOMRect(0, 0, width, height),
  devicePixelContentBoxSize: [],
  target: document.createElement('div'),
});

describe('useDimensions', () => {
  beforeEach(() => {
    resizeObservers.length = 0;
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns zero dimensions without observing when the ref has no element', () => {
    const ref = createRef<HTMLElement>();
    const { result } = renderHook(() => useDimensions(ref));

    expect(result.current).toEqual({
      dimensions: { height: 0, width: 0 },
      isResizing: false,
    });
    expect(resizeObservers).toHaveLength(0);
  });

  it('debounces changed dimensions and skips unchanged values', () => {
    const element = document.createElement('div');
    const ref = createRef<HTMLElement>();
    ref.current = element;
    const onResizeCallback = vi.fn();
    const { result } = renderHook(() => useDimensions(ref, onResizeCallback));
    const observer = resizeObservers[0];

    expect(result.current.dimensions).toEqual({ height: 0, width: 0 });
    expect(observer.observe).toHaveBeenNthCalledWith(1, element, { box: 'content-box' });
    expect(observer.observe).toHaveBeenNthCalledWith(2, document.body);

    act(() => {
      observer.callback([createResizeEntry(100, 200)], observer);
    });

    expect(result.current.isResizing).toBe(true);
    const activeObserver = resizeObservers.at(-1);

    act(() => {
      activeObserver.callback([createResizeEntry(100, 200)], activeObserver);
      activeObserver.callback([createResizeEntry(100, 201)], activeObserver);
      activeObserver.callback([createResizeEntry(101, 201)], activeObserver);
    });

    expect(vi.getTimerCount()).toBe(1);
    expect(onResizeCallback).not.toHaveBeenCalled();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.isResizing).toBe(false);
    expect(result.current.dimensions).toEqual({ height: 201, width: 101 });
    expect(onResizeCallback).toHaveBeenCalledOnce();
  });

  it('disconnects the observer and cancels pending callbacks on unmount', () => {
    const ref = createRef<HTMLElement>();
    ref.current = document.createElement('div');
    const onResizeCallback = vi.fn();
    const { unmount } = renderHook(() => useDimensions(ref, onResizeCallback));
    const observer = resizeObservers[0];

    act(() => {
      observer.callback([createResizeEntry(10, 20)], observer);
    });

    const activeObserver = resizeObservers.at(-1);
    unmount();

    expect(activeObserver.disconnect).toHaveBeenCalledOnce();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(onResizeCallback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('disconnects the observer without clearing a timer when no resize is pending', () => {
    const ref = createRef<HTMLElement>();
    ref.current = document.createElement('div');
    const { unmount } = renderHook(() => useDimensions(ref));
    const observer = resizeObservers[0];

    unmount();

    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('updates state when no resize callback is provided', () => {
    const ref = createRef<HTMLElement>();
    ref.current = document.createElement('div');
    const { result } = renderHook(() => useDimensions(ref));
    const observer = resizeObservers[0];

    act(() => {
      observer.callback([createResizeEntry(10, 20)], observer);
      vi.runOnlyPendingTimers();
    });

    expect(result.current).toEqual({
      dimensions: { height: 20, width: 10 },
      isResizing: false,
    });
  });
});

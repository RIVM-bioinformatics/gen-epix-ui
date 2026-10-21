import { renderHook } from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useScrollbarSize } from './useScrollbarSize';

describe('useScrollbarSize', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures the scrollbar once and removes its temporary elements', () => {
    const container = document.createElement('div');
    const initialChildCount = document.body.childElementCount;
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    const { rerender, result } = renderHook(() => useScrollbarSize(), { container });

    expect(typeof result.current).toBe('number');
    expect(document.body.childElementCount).toBe(initialChildCount);
    expect(appendChild).toHaveBeenCalledTimes(2);
    expect(removeChild).toHaveBeenCalledTimes(2);

    rerender();

    expect(appendChild).toHaveBeenCalledTimes(2);
    expect(removeChild).toHaveBeenCalledTimes(2);
  });
});

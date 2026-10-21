import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { useArray } from './useArray';

describe('useArray', () => {
  it('preserves the array reference until the input array changes', () => {
    const initialItems = [1, 2, 3];
    const updatedItems = [4, 5];
    const { rerender, result } = renderHook(({ items }) => useArray(items), {
      initialProps: { items: initialItems },
    });

    expect(result.current).toBe(initialItems);

    rerender({ items: initialItems });

    expect(result.current).toBe(initialItems);

    rerender({ items: updatedItems });

    expect(result.current).toBe(updatedItems);
  });
});

import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { useCaseTypeSetCategoryPurposeOptionsQuery } from './useCaseTypeSetCategoryPurposeQuery';

describe('useCaseTypeSetCategoryPurposeOptionsQuery', () => {
  it('returns the content and security options with stable loaded state', () => {
    const { rerender, result, unmount } = renderHook(() => useCaseTypeSetCategoryPurposeOptionsQuery());
    const firstResult = result.current;

    expect(firstResult).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'CONTENT', value: 'CONTENT' },
        { label: 'SECURITY', value: 'SECURITY' },
      ],
    });

    act(() => rerender());
    expect(result.current).toBe(firstResult);

    act(() => unmount());
  });
});

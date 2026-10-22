import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { CaseDbTreeAlgorithmType } from '@gen-epix/api-casedb';

import {
  treeAlgorithmCodeValues,
  useTreeAlgorithmCodeOptionsQuery,
} from './useTreeAlgorithmCodesQuery';

describe('treeAlgorithmCodeValues', () => {
  it('provides a label for every supported tree algorithm code', () => {
    const expectedValues = Object.values(CaseDbTreeAlgorithmType);

    expect(treeAlgorithmCodeValues).toEqual(Object.fromEntries(
      expectedValues.map(value => [value, value]),
    ));
  });
});

describe('useTreeAlgorithmCodeOptionsQuery', () => {
  it('returns stable loaded options for all tree algorithm codes', () => {
    const { rerender, result, unmount } = renderHook(() => useTreeAlgorithmCodeOptionsQuery());
    const firstResult = result.current;
    const expectedOptions = Object.entries(treeAlgorithmCodeValues).map(([value, label]) => ({ label, value }));

    expect(firstResult).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: expectedOptions,
    });

    act(() => rerender());
    expect(result.current).toBe(firstResult);

    act(() => unmount());
  });
});

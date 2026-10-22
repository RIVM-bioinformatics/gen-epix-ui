import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { CaseDbColType } from '@gen-epix/api-casedb';

import {
  colTypePresentationValues,
  useColTypeOptionsQuery,
} from './useColTypesQuery';

describe('colTypePresentationValues', () => {
  it('provides a label for every column type', () => {
    const expectedValues = Object.values(CaseDbColType);

    expect(colTypePresentationValues).toEqual(Object.fromEntries(
      expectedValues.map(value => [value, value]),
    ));
  });
});

describe('useColTypeOptionsQuery', () => {
  it('returns stable loaded options for all column types', () => {
    const { rerender, result, unmount } = renderHook(() => useColTypeOptionsQuery());
    const firstResult = result.current;
    const expectedOptions = Object.entries(colTypePresentationValues).map(([value, label]) => ({ label, value }));

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

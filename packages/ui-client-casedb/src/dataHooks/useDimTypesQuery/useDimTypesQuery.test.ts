import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { CaseDbDimType } from '@gen-epix/api-casedb';

import {
  dimTypePresentationValues,
  useDimTypeOptionsQuery,
} from './useDimTypesQuery';

describe('dimTypePresentationValues', () => {
  it('provides a label for every dimension type', () => {
    const expectedValues = Object.values(CaseDbDimType);

    expect(dimTypePresentationValues).toEqual(Object.fromEntries(
      expectedValues.map(value => [value, value]),
    ));
  });
});

describe('useDimTypeOptionsQuery', () => {
  it('returns stable loaded options for all dimension types', () => {
    const { rerender, result, unmount } = renderHook(() => useDimTypeOptionsQuery());
    const firstResult = result.current;
    const expectedOptions = Object.entries(dimTypePresentationValues).map(([value, label]) => ({ label, value }));

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

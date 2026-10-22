import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { CaseDbRegionRelationType } from '@gen-epix/api-casedb';

import {
  regionRelationTypePresentationValues,
  useRegionRelationTypeOptionsQuery,
} from './useRegionRelationTypeQuery';

describe('regionRelationTypePresentationValues', () => {
  it('maps supported relation types to their presentation labels', () => {
    expect(regionRelationTypePresentationValues).toEqual({
      [CaseDbRegionRelationType.CONTAINS]: 'CONTAINS',
      [CaseDbRegionRelationType.IS_ADJACENT_TO]: 'IS_ADJACENT_TO',
      [CaseDbRegionRelationType.IS_SEPARATE_FROM]: 'IS_SEPARATE_FROM',
      [CaseDbRegionRelationType.OVERLAPS_WITH]: 'OVERLAPS_WITH',
    });
  });
});

describe('useRegionRelationTypeOptionsQuery', () => {
  it('returns stable options with a complete loaded state', () => {
    const { rerender, result, unmount } = renderHook(() => useRegionRelationTypeOptionsQuery());
    const firstResult = result.current;
    const expectedOptions = Object.entries(regionRelationTypePresentationValues).map(([value, label]) => ({ label, value }));

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

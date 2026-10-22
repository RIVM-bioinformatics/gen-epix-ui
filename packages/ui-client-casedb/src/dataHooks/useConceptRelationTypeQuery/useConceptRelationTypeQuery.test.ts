import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { CaseDbConceptRelationType } from '@gen-epix/api-casedb';

import {
  conceptRelationTypePresentationValues,
  useConceptRelationTypeOptionsQuery,
} from './useConceptRelationTypeQuery';

describe('conceptRelationTypePresentationValues', () => {
  it('provides presentation values for supported relation types', () => {
    expect(conceptRelationTypePresentationValues).toEqual({
      [CaseDbConceptRelationType.CONTAINS]: 'CONTAINS',
    });
  });
});

describe('useConceptRelationTypeOptionsQuery', () => {
  it('returns stable options with a complete loaded state', () => {
    const { rerender, result, unmount } = renderHook(() => useConceptRelationTypeOptionsQuery());
    const firstResult = result.current;

    expect(firstResult).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'CONTAINS', value: 'CONTAINS' },
      ],
    });

    act(() => rerender());
    expect(result.current).toBe(firstResult);

    act(() => unmount());
  });
});

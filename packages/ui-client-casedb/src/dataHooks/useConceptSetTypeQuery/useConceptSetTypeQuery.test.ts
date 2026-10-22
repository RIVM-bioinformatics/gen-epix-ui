import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { CaseDbConceptSetType } from '@gen-epix/api-casedb';

import {
  conceptSetTypePresentationValues,
  useConceptSetTypeOptionsQuery,
} from './useConceptSetTypeQuery';

describe('conceptSetTypePresentationValues', () => {
  it('maps the supported concept-set types to their presentation labels', () => {
    expect(conceptSetTypePresentationValues).toEqual({
      [CaseDbConceptSetType.CONTEXT_FREE_GRAMMAR_JSON]: 'CONTEXT_FREE_GRAMMAR_JSON',
      [CaseDbConceptSetType.CONTEXT_FREE_GRAMMAR_XML]: 'CONTEXT_FREE_GRAMMAR_XML',
      [CaseDbConceptSetType.INTERVAL]: 'INTERVAL',
      [CaseDbConceptSetType.NOMINAL]: 'NOMINAL',
      [CaseDbConceptSetType.ORDINAL]: 'ORDINAL',
      [CaseDbConceptSetType.REGULAR_LANGUAGE]: 'REGULAR_LANGUAGE',
    });
  });
});

describe('useConceptSetTypeOptionsQuery', () => {
  it('returns stable options with a complete loaded state', () => {
    const { rerender, result, unmount } = renderHook(() => useConceptSetTypeOptionsQuery());
    const firstResult = result.current;
    const expectedOptions = Object.entries(conceptSetTypePresentationValues).map(([value, label]) => ({ label, value }));

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

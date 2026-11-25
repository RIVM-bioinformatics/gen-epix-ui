import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { CaseDbUnit } from '@gen-epix/api-casedb';

import {
  unitValues,
  useUnitOptionsQuery,
} from './useUnitQuery';

describe('unitValues', () => {
  it('maps every CaseDbUnit to its own name', () => {
    expect(Object.keys(unitValues).sort()).toEqual(Object.values(CaseDbUnit).sort());
    Object.entries(unitValues).forEach(([unit, label]) => {
      expect(label).toBe(unit);
    });
  });
});

describe('useUnitOptionsQuery', () => {
  it('returns one option per unit with the unit as value and label', () => {
    const { result } = renderHook(() => useUnitOptionsQuery());

    expect(result.current.options).toHaveLength(Object.values(CaseDbUnit).length);
    expect(result.current.options).toEqual(expect.arrayContaining(
      Object.values(CaseDbUnit).map(unit => ({ label: unit, value: unit })),
    ));
  });

  it('returns a ready state without errors', () => {
    const { result } = renderHook(() => useUnitOptionsQuery());

    expect(result.current).toMatchObject({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
    });
  });

  it('returns a stable result across re-renders', () => {
    const { rerender, result } = renderHook(() => useUnitOptionsQuery());
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});

import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createElement } from 'react';
import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  CaseDbCaseTypeSet,
  CaseDbCaseTypeSetCategory,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useCaseTypeSetNameFactory,
  useCaseTypeSetOptionsQuery,
  useCaseTypeSetsMapQuery,
  useCaseTypeSetsQuery,
} from './useCaseTypeSetsQuery';

const createCategory = (id: string, name: string): CaseDbCaseTypeSetCategory => ({
  description: null,
  id,
  name,
  rank: 1,
});

const createCaseTypeSet = (id: string, name: string, categoryId: string, rank: number): CaseDbCaseTypeSet => ({
  case_type_set_category_id: categoryId,
  id,
  name,
  rank,
});

const createHookContext = (caseTypeSets: CaseDbCaseTypeSet[], categories: CaseDbCaseTypeSetCategory[], error?: Error, categoryError?: Error) => {
  const caseTypeSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: caseTypeSets, signal });
  });
  const caseTypeSetCategoriesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (categoryError) {
      return Promise.reject(categoryError);
    }
    return Promise.resolve({ data: categories, signal });
  });
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(CaseDbCaseApi, { caseTypeSetCategoriesGetAll, caseTypeSetsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseTypeSetCategoriesGetAll,
    caseTypeSetsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseTypeSetsQuery', () => {
  it('loads case-type sets and passes the abort signal to the API', async () => {
    const caseTypeSets = [createCaseTypeSet('set-1', 'Set one', 'category-1', 1)];
    const { caseTypeSetsGetAll, dispose, wrapper } = createHookContext(caseTypeSets, []);
    const { result, unmount } = renderHook(() => useCaseTypeSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(caseTypeSets);
    expect(caseTypeSetsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(caseTypeSetsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes case-type-set API failures', async () => {
    const error = new Error('Case-type sets unavailable');
    const { dispose, wrapper } = createHookContext([], [], error);
    const { result, unmount } = renderHook(() => useCaseTypeSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseTypeSetsMapQuery', () => {
  it('maps case-type sets by ID', async () => {
    const caseTypeSets = [createCaseTypeSet('set-1', 'Set one', 'category-1', 1), createCaseTypeSet('set-2', 'Set two', 'category-1', 2)];
    const { dispose, wrapper } = createHookContext(caseTypeSets, []);
    const { result, unmount } = renderHook(() => useCaseTypeSetsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('set-1')).toEqual(caseTypeSets[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when case-type-set loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], [], new Error('Case-type sets unavailable'));
    const { result, unmount } = renderHook(() => useCaseTypeSetsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseTypeSetNameFactory', () => {
  it('combines category and set names and handles unknown categories', async () => {
    const categories = [createCategory('category-1', 'Category one')];
    const { dispose, wrapper } = createHookContext([], categories);
    const { result, unmount } = renderHook(() => useCaseTypeSetNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createCaseTypeSet('set-1', 'Set one', 'category-1', 1))).toBe('Category one | Set one');
    expect(result.current.getName(createCaseTypeSet('set-2', 'Set two', 'missing-category', 1))).toBe(' | Set two');
    expect(result.current.error).toBeUndefined();

    act(() => unmount());
    dispose();
  });

  it('retains the name factory when category loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], [], undefined, new Error('Categories unavailable'));
    const { result, unmount } = renderHook(() => useCaseTypeSetNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.getName(createCaseTypeSet('set-1', 'Set one', 'category-1', 1))).toBe(' | Set one');

    act(() => unmount());
    dispose();
  });
});

describe('useCaseTypeSetOptionsQuery', () => {
  it('creates sorted category-prefixed set options', async () => {
    const categories = [createCategory('category-1', 'Category one'), createCategory('category-2', 'Category two')];
    const caseTypeSets = [
      createCaseTypeSet('set-2', 'Zulu set', 'category-2', 2),
      createCaseTypeSet('set-1', 'Alpha set', 'category-1', 1),
    ];
    const { dispose, wrapper } = createHookContext(caseTypeSets, categories);
    const { result, unmount } = renderHook(() => useCaseTypeSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Category one | Alpha set', value: 'set-1' },
      { label: 'Category two | Zulu set', value: 'set-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when case-type-set loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], [], new Error('Case-type sets unavailable'));
    const { result, unmount } = renderHook(() => useCaseTypeSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
